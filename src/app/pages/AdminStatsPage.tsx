import MainLayout from '../components/layout/MainLayout';
import { TrendingUp, TrendingDown, Users, Phone, Clock, CheckCircle, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { fetchConsultations } from '@/api/consultationApi';
import { fetchEmployees, type Employee } from '@/api/employeesApi';

// SLA 기준
const FCR_TARGET = 92; // FCR 목표 (%)
const AVG_TIME_TARGET_SECONDS = 300; // 평균 처리시간 목표 (5:00)

export default function AdminStatsPage() {
  const [consultationsData, setConsultationsData] = useState<any[]>([]);
  const [employeesDataStateState, setEmployeesDataState] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [consultations, employees] = await Promise.all([
          fetchConsultations({ limit: 500 }),
          fetchEmployees(200),
        ]);
        setConsultationsData(consultations);
        setEmployeesDataState(employees);
      } catch (err) {
        console.error('[AdminStats] 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ⭐ consultationsData에서 일별 추이 동적 생성
  const dailyTrend = useMemo(() => {
    // datetime에서 날짜별 그룹핑
    const byDate = new Map<string, { calls: number; fcrCount: number }>();

    consultationsData.forEach((c) => {
      const date = c.datetime.split(' ')[0]; // "2025-01-05"
      if (!byDate.has(date)) {
        byDate.set(date, { calls: 0, fcrCount: 0 });
      }
      const entry = byDate.get(date)!;
      entry.calls++;
      if (c.fcr) entry.fcrCount++;
    });

    // 날짜순 정렬 후 최대 7일
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: date.substring(5), // "01-05"
        calls: data.calls,
        fcr: data.calls > 0 ? Math.round((data.fcrCount / data.calls) * 100) : 0,
      }));
  }, [consultationsData]);

  // ⭐ 동적 통계 계산
  const stats = useMemo(() => {
    const totalCalls = consultationsData.length;
    const totalEmployees = employeesDataState.length;

    // FCR: 전체 상담 건수 중 FCR 달성 비율
    const fcrCalls = consultationsData.filter((c) => c.fcr).length;
    const avgFCR = totalCalls > 0 ? Math.round((fcrCalls / totalCalls) * 100) : 0;

    // 평균 처리시간 (consultationsData의 duration 기반)
    const totalSeconds = consultationsData.reduce((sum, c) => {
      const [min, sec] = (c.duration || '0:00').split(':').map(Number);
      return sum + (min * 60 + sec);
    }, 0);
    const avgSeconds = totalCalls > 0 ? totalSeconds / totalCalls : 0;
    const avgTime = `${Math.floor(avgSeconds / 60)}:${String(Math.floor(avgSeconds % 60)).padStart(2, '0')}`;

    // 변화율: 최근 날짜 vs 그 전날 비교
    let todayCallsChange = 0;
    let fcrChange = 0;
    if (dailyTrend.length >= 2) {
      const latest = dailyTrend[dailyTrend.length - 1];
      const prev = dailyTrend[dailyTrend.length - 2];
      todayCallsChange = prev.calls > 0 ? Math.round(((latest.calls - prev.calls) / prev.calls) * 100) : 0;
      fcrChange = latest.fcr - prev.fcr;
    }

    return { totalCalls, totalEmployees, avgFCR, avgHandleTime: avgTime, avgSeconds, todayCallsChange, fcrChange };
  }, [consultationsData, employeesDataState, dailyTrend]);

  // ⭐ 팀별 통계 (consultationsData 기반 실제 건수 + employeesDataState 기반 인원)
  const teamStats = useMemo(() => {
    // 팀 목록을 employeesData에서 동적으로 추출
    const teamSet = new Set(employeesDataState.map(emp => emp.team).filter(Boolean));
    const teams = Array.from(teamSet).sort() as string[];

    return teams.map((teamName) => {
      const teamMembers = employeesDataState.filter((emp) => emp.team === teamName);
      const members = teamMembers.length;

      // consultationsData에서 해당 팀 상담원의 상담 건수
      const teamAgentNames = teamMembers.map((m) => m.name);
      const teamConsultations = consultationsData.filter((c) => teamAgentNames.includes(c.agent));
      const calls = teamConsultations.length;
      const fcrCalls = teamConsultations.filter((c) => c.fcr).length;
      const fcr = calls > 0 ? Math.round((fcrCalls / calls) * 100) : 0;

      // 팀 평균 처리시간 (consultationsData 기반)
      const totalSec = teamConsultations.reduce((sum, c) => {
        const [min, sec] = (c.duration || '0:00').split(':').map(Number);
        return sum + (min * 60 + sec);
      }, 0);
      const avgSec = calls > 0 ? totalSec / calls : 0;
      const avgTime = `${Math.floor(avgSec / 60)}:${String(Math.floor(avgSec % 60)).padStart(2, '0')}`;

      const leader = teamMembers.find((emp) => emp.position === '팀장')?.name || '미정';

      // employeesDataState 기반 총 상담 건수 (누적)
      const totalConsultations = teamMembers.reduce((sum, emp) => sum + (emp.consultations || 0), 0);

      return { team: teamName, members, calls, totalConsultations, fcr, avgTime, avgSec, leader };
    }).sort((a, b) => b.fcr - a.fcr); // FCR 높은 순 정렬
  }, [consultationsData, employeesDataState]);

  // ⭐ 상담 유형별 분포 (consultationsData의 category 기반)
  const categoryStats = useMemo(() => {
    const byCategory = new Map<string, { count: number; fcrCount: number }>();

    consultationsData.forEach((c) => {
      const mainCategory = c.category.split(' > ')[0]; // 대분류만
      if (!byCategory.has(mainCategory)) {
        byCategory.set(mainCategory, { count: 0, fcrCount: 0 });
      }
      const entry = byCategory.get(mainCategory)!;
      entry.count++;
      if (c.fcr) entry.fcrCount++;
    });

    return Array.from(byCategory.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        fcr: data.count > 0 ? Math.round((data.fcrCount / data.count) * 100) : 0,
        ratio: Math.round((data.count / consultationsData.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [consultationsData]);

  // ⭐ 알림 자동 생성 (데이터 기반)
  const issueAlerts = useMemo(() => {
    const alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string; detail: string }> = [];

    // 팀별 SLA 기준 확인
    teamStats.forEach((team) => {
      if (team.avgSec > AVG_TIME_TARGET_SECONDS) {
        const overMin = Math.floor((team.avgSec - AVG_TIME_TARGET_SECONDS) / 60);
        const overSec = Math.floor((team.avgSec - AVG_TIME_TARGET_SECONDS) % 60);
        alerts.push({
          type: 'warning',
          message: `${team.team} 평균 처리시간 목표 초과`,
          detail: `목표 5:00 대비 ${overMin}분 ${overSec}초 초과 (현재 ${team.avgTime})`,
        });
      }
      if (team.fcr >= FCR_TARGET) {
        alerts.push({
          type: 'success',
          message: `${team.team} FCR 목표 달성`,
          detail: `목표 ${FCR_TARGET}% 대비 ${team.fcr}% 달성 (팀장: ${team.leader})`,
        });
      }
      if (team.fcr < FCR_TARGET - 5) {
        alerts.push({
          type: 'warning',
          message: `${team.team} FCR 주의`,
          detail: `목표 ${FCR_TARGET}% 대비 ${team.fcr}% (${FCR_TARGET - team.fcr}%p 미달)`,
        });
      }
    });

    // 전일 대비 변화
    if (stats.todayCallsChange > 10) {
      alerts.push({
        type: 'info',
        message: `최근 상담 건수 전일 대비 ${stats.todayCallsChange}% 증가`,
        detail: `인입량 증가에 따른 인력 재배치 검토 필요`,
      });
    } else if (stats.todayCallsChange < -10) {
      alerts.push({
        type: 'info',
        message: `최근 상담 건수 전일 대비 ${Math.abs(stats.todayCallsChange)}% 감소`,
        detail: `인입량 감소 추이 확인 필요`,
      });
    }

    // 미완료 상담 경고
    const incompleteCount = consultationsData.filter((c) => c.status === '미완료').length;
    if (incompleteCount > 0) {
      alerts.push({
        type: 'warning',
        message: `미완료 상담 ${incompleteCount}건 존재`,
        detail: `후처리 미완료 건에 대한 팔로업 필요`,
      });
    }

    // 알림이 없으면 기본 알림
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        message: '모든 SLA 지표 정상 범위',
        detail: '현재 모든 팀이 목표를 달성하고 있습니다',
      });
    }

    return alerts;
  }, [teamStats, stats.todayCallsChange]);

  const maxCalls = Math.max(...dailyTrend.map((d) => d.calls), 1);

  // 카테고리 색상
  const categoryColors = ['#0047AB', '#4A90E2', '#34A853', '#FBBC04', '#EA4335', '#E91E63', '#9C27B0', '#FF6B35'];

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[var(--content-height)] flex items-center justify-center bg-[#F5F5F5]">
          <div className="flex items-center gap-3 text-[#666666]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">통계 데이터 로딩 중...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-[var(--content-height)] flex flex-col p-6 gap-4 bg-[#F5F5F5] pb-20">
        {/* Header + KPI Cards in same row */}
        <div className="grid grid-cols-5 gap-4 flex-shrink-0">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-[#0047AB] to-[#003580] text-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold">총괄 현황</h1>
            </div>
            <p className="text-[11px] opacity-90">센터 운영 현황</p>
          </div>

          {/* KPI Card 1 - 총 상담 건수 */}
          <div className="bg-white rounded-lg shadow-sm p-2.5 border border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 bg-[#E8F1FC] rounded flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 text-[#0047AB]" />
              </div>
              {stats.todayCallsChange !== 0 && (
                <div className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  stats.todayCallsChange > 0 ? 'bg-[#E8F5E9] text-[#34A853]' : 'bg-[#FFEBEE] text-[#EA4335]'
                }`}>
                  {stats.todayCallsChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.todayCallsChange > 0 ? '+' : ''}{stats.todayCallsChange}%
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-[#333333] mb-0.5">{stats.totalCalls}</div>
            <div className="text-[10px] text-[#666666]">총 상담 건수</div>
          </div>

          {/* KPI Card 2 - 상담사 수 */}
          <div className="bg-white rounded-lg shadow-sm p-2.5 border border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 bg-[#E8F5E9] rounded flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-[#34A853]" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#333333] mb-0.5">{stats.totalEmployees}</div>
            <div className="text-[10px] text-[#666666]">총 상담사 수</div>
          </div>

          {/* KPI Card 3 - FCR */}
          <div className="bg-white rounded-lg shadow-sm p-2.5 border border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 bg-[#FFF9E6] rounded flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-[#FBBC04]" />
              </div>
              {stats.fcrChange !== 0 && (
                <div className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  stats.fcrChange > 0 ? 'bg-[#E8F5E9] text-[#34A853]' : 'bg-[#FFEBEE] text-[#EA4335]'
                }`}>
                  {stats.fcrChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.fcrChange > 0 ? '+' : ''}{stats.fcrChange}%p
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-[#333333] mb-0.5">
              {stats.avgFCR}%
              <span className="text-[10px] font-normal text-[#999999] ml-1">/ 목표 {FCR_TARGET}%</span>
            </div>
            <div className="text-[10px] text-[#666666]">FCR (초회 해결률)</div>
          </div>

          {/* KPI Card 4 - 평균 처리시간 */}
          <div className="bg-white rounded-lg shadow-sm p-2.5 border border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 bg-[#FCE4EC] rounded flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#E91E63]" />
              </div>
              {stats.avgSeconds > AVG_TIME_TARGET_SECONDS && (
                <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFEBEE] text-[#EA4335]">
                  초과
                </div>
              )}
              {stats.avgSeconds <= AVG_TIME_TARGET_SECONDS && (
                <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#34A853]">
                  정상
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-[#333333] mb-0.5">
              {stats.avgHandleTime}
              <span className="text-[10px] font-normal text-[#999999] ml-1">/ 목표 5:00</span>
            </div>
            <div className="text-[10px] text-[#666666]">평균 처리 시간</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Team Stats + Chart */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden">
            <div className="px-5 py-2.5 border-b border-[#E0E0E0] flex-shrink-0 flex items-center justify-between">
              <h2 className="font-bold text-[#333333]">팀별 성과</h2>
              <span className="text-[10px] text-[#999999]">FCR 높은 순 정렬</span>
            </div>

            <div className="flex-shrink-0 p-3">
              <table className="w-full">
                <thead className="border-b-2 border-[#E0E0E0]">
                  <tr>
                    <th className="text-left text-xs font-semibold text-[#666666] pb-2">순위</th>
                    <th className="text-left text-xs font-semibold text-[#666666] pb-2">팀명</th>
                    <th className="text-left text-xs font-semibold text-[#666666] pb-2">팀장</th>
                    <th className="text-center text-xs font-semibold text-[#666666] pb-2">인원</th>
                    <th className="text-center text-xs font-semibold text-[#666666] pb-2">상담 건수</th>
                    <th className="text-center text-xs font-semibold text-[#666666] pb-2">FCR</th>
                    <th className="text-center text-xs font-semibold text-[#666666] pb-2">평균 시간</th>
                    <th className="text-center text-xs font-semibold text-[#666666] pb-2">달성</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((team, idx) => (
                    <tr
                      key={team.team}
                      className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]"
                    >
                      <td className="py-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                          idx === 0 ? 'bg-[#FBBC04] text-white' : idx === 1 ? 'bg-[#C0C0C0] text-white' : 'bg-[#CD7F32] text-white'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="font-semibold text-sm text-[#333333]">{team.team}</span>
                      </td>
                      <td className="py-2">
                        <span className="text-sm text-[#666666]">{team.leader}</span>
                      </td>
                      <td className="py-2 text-center">
                        <span className="text-sm text-[#333333]">{team.members}명</span>
                      </td>
                      <td className="py-2 text-center">
                        <span className="text-sm font-semibold text-[#0047AB]">{team.calls}</span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`text-sm font-semibold ${
                          team.fcr >= FCR_TARGET ? 'text-[#34A853]' :
                          team.fcr >= FCR_TARGET - 5 ? 'text-[#FBBC04]' :
                          'text-[#EA4335]'
                        }`}>
                          {team.fcr}%
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`text-sm font-mono ${
                          team.avgSec <= AVG_TIME_TARGET_SECONDS ? 'text-[#34A853]' : 'text-[#EA4335]'
                        }`}>
                          {team.avgTime}
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {team.fcr >= FCR_TARGET && team.avgSec <= AVG_TIME_TARGET_SECONDS ? (
                          <CheckCircle className="w-4 h-4 text-[#34A853] mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[#FBBC04] mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Daily Trend Chart */}
            <div className="p-3 border-t border-[#E0E0E0] flex-shrink-0">
              <h3 className="text-sm font-semibold text-[#333333] mb-2">일별 추이 ({dailyTrend.length}일)</h3>
              <div className="flex items-end justify-between h-20 gap-3">
                {dailyTrend.map((day) => {
                  const barHeight = (day.calls / maxCalls) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
                        <div
                          className="w-full bg-gradient-to-t from-[#0047AB] to-[#4A90E2] rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group"
                          style={{ height: `${barHeight}%` }}
                        >
                          <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#333333] text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div className="font-semibold">{day.calls}건</div>
                            <div className="text-[10px]">FCR: {day.fcr}%</div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#333333]"></div>
                          </div>
                          <div
                            className="absolute top-0 right-0 w-2 h-full bg-[#34A853] rounded-tr-lg"
                            style={{ opacity: day.fcr / 100 }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#666666] mt-1.5 font-mono">{day.date}</div>
                      <div className="text-[10px] font-semibold text-[#0047AB]">{day.calls}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[#666666]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0047AB] rounded"></div>
                  <span>상담 건수</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#34A853] rounded"></div>
                  <span>FCR 달성도</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Alerts + Category */}
          <div className="flex flex-col gap-4 min-h-0">
            {/* Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="px-5 py-2.5 border-b border-[#E0E0E0] flex-shrink-0">
                <h2 className="font-bold text-[#333333] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FBBC04]" />
                  알림
                  <span className="text-[10px] font-normal text-[#999999] ml-1">{issueAlerts.length}건</span>
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {issueAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-2.5 rounded-lg border-l-4 ${
                        alert.type === 'warning' ? 'bg-[#FFF9E6] border-[#FBBC04]' :
                        alert.type === 'success' ? 'bg-[#E8F5E9] border-[#34A853]' :
                        'bg-[#E8F1FC] border-[#0047AB]'
                      }`}
                    >
                      <div className="text-xs font-medium text-[#333333] mb-0.5">{alert.message}</div>
                      <div className="text-[10px] text-[#666666]">{alert.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="px-5 py-2.5 border-b border-[#E0E0E0] flex-shrink-0">
                <h2 className="font-bold text-[#333333] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0047AB]" />
                  상담 유형별 분포
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                  {categoryStats.map((cat, index) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <div className="w-16 text-[10px] text-[#333333] font-medium truncate" title={cat.category}>
                        {cat.category}
                      </div>
                      <div className="flex-1 h-4 bg-[#F0F0F0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cat.ratio}%`,
                            backgroundColor: categoryColors[index % categoryColors.length],
                          }}
                        ></div>
                      </div>
                      <div className="w-12 text-right text-[10px] font-semibold text-[#333333]">
                        {cat.count}건
                      </div>
                      <div className={`w-10 text-right text-[10px] font-semibold ${
                        cat.fcr >= FCR_TARGET ? 'text-[#34A853]' : 'text-[#EA4335]'
                      }`}>
                        {cat.fcr}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3 mt-2 text-[10px] text-[#999999]">
                  <span>건수</span>
                  <span>FCR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
