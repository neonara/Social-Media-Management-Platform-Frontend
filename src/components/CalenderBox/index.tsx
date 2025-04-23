"use client";

import React, { useState } from 'react';
import {
  format,
  isSameDay,
  isSameHour,
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfQuarter,
  endOfQuarter,
  addMonths,
  subMonths,
  subQuarters,
  eachMonthOfInterval,
  differenceInWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface AnalyticsData {
  period: string;
  posts: number;
  engagement: number;
}
interface ContentItem {
  id: string;
  title: string;
  platform: 'Facebook' | 'Instagram' | 'LinkedIn';
  scheduledTime: Date;
  durationInHours: number;
  color?: string; // For visual differentiation
}


const AnalyticsGrid = ({ currentDate, calendarView }: { currentDate: Date; calendarView: 'week' | 'month' | 'quarter' | 'year' }) => {
  const generateAnalyticsData = (): AnalyticsData[] => {
    const now = new Date();
    switch(calendarView) {
      case 'month': {
        const monthsToShow = 3;
        return Array.from({ length: monthsToShow }).map((_, i) => {
          const monthDate = subMonths(startOfMonth(currentDate), i);
          return {
            period: format(monthDate, 'MMM yyyy'),
            posts: Math.floor(Math.random() * 300 + 100 * (monthsToShow - i)),
            engagement: Math.floor(Math.random() * 5000 + 2000 * (monthsToShow - i))
          };
        }).reverse();
      }
      
      case 'quarter': {
        const quartersToShow = 4;
        return Array.from({ length: quartersToShow }).map((_, i) => {
          const quarterStart = subQuarters(startOfQuarter(currentDate), i);
          return {
            period: `Q${Math.ceil((quarterStart.getMonth() + 1)/3)} ${format(quarterStart, 'yyyy')}`,
            posts: Math.floor(Math.random() * 900 + 300 * (quartersToShow - i)),
            engagement: Math.floor(Math.random() * 15000 + 5000 * (quartersToShow - i))
          };
        }).reverse();
      }
      
      case 'year': {
        return eachMonthOfInterval({
          start: startOfYear(currentDate),
          end: endOfYear(currentDate)
        }).map(month => ({
          period: format(month, 'MMM'),
          posts: Math.floor(Math.random() * 100 + 50 * (12 - month.getMonth())),
          engagement: Math.floor(Math.random() * 2000 + 1000 * (12 - month.getMonth()))
        }));
      }
      
      default: {
        const weekStart = startOfWeek(currentDate);
        return eachDayOfInterval({ 
          start: weekStart, 
          end: addDays(weekStart, 6) 
        }).map(day => ({
          period: format(day, 'EEE'),
          posts: Math.floor(Math.random() * 20 + 10),
          engagement: Math.floor(Math.random() * 500 + 200)
        }));
      }
    }
  };

  const analyticsData = generateAnalyticsData();

  return (
    <div className="p-4">
      <h3 className="mb-4 text-xl font-semibold dark:text-white">
        {calendarView.charAt(0).toUpperCase() + calendarView.slice(1)} Analytics
      </h3>
      
      <div className="rounded-lg border border-stroke dark:border-dark-3">
        <div className="grid grid-cols-3 bg-gray-1 dark:bg-gray-dark-1 p-4 font-medium text-dark dark:text-white">
          <div>Period</div>
          <div>Posts</div>
          <div>Engagement</div>
        </div>
        
        {analyticsData.map((item, index) => (
          <div 
            key={index}
            className="grid grid-cols-3 p-4 border-b border-stroke dark:border-dark-3 hover:bg-gray-1 dark:hover:bg-dark-2"
          >
            <div className="text-dark dark:text-white">{item.period}</div>
            <div className="text-primary dark:text-primary-dark">{item.posts}</div>
            <div className="text-blue-600 dark:text-blue-300">{item.engagement.toLocaleString()}</div>
          </div>
        ))}
        
        <div className="grid grid-cols-3 p-4 bg-gray-1 dark:bg-gray-dark-1 font-semibold">
          <div className="text-dark dark:text-white">Average</div>
          <div className="text-primary dark:text-primary-dark">
            {Math.round(analyticsData.reduce((sum, item) => sum + item.posts, 0) / analyticsData.length)}
          </div>
          <div className="text-blue-600 dark:text-blue-300">
            {Math.round(analyticsData.reduce((sum, item) => sum + item.engagement, 0) / analyticsData.length).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentDashboard = () => (
  <div className="p-4">
    <div className="mb-6 flex gap-4">
      {['Facebook', 'Instagram', 'LinkedIn'].map(platform => (
        <button
          key={platform}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white dark:bg-primary-dark"
        >
          <span className="text-sm">{platform}</span>
        </button>
      ))}
    </div>

    <div className="mb-6 rounded-lg border border-stroke p-4 dark:border-dark-3">
      <h3 className="mb-4 text-lg font-semibold dark:text-white">Content Approval Status</h3>
      <div className="grid grid-cols-3 gap-4">
        {['Draft', 'Pending Approval', 'Approved'].map(status => (
          <div
            key={status}
            className="rounded-lg bg-gray-1 p-4 dark:bg-gray-dark-1"
          >
            <div className="text-sm font-medium text-dark dark:text-white">{status}</div>
            <div className="text-2xl font-bold text-primary dark:text-primary-dark">
              {Math.floor(Math.random() * 20)}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {['Repurpose Content', 'New Ideas', 'Get Inspired'].map((action, idx) => (
        <div
          key={idx}
          className="cursor-pointer rounded-lg border border-stroke p-4 transition-all hover:shadow-md dark:border-dark-3"
        >
          <h4 className="mb-2 font-medium text-dark dark:text-white">{action}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {action === 'Repurpose Content' 
              ? 'Reuse top-performing posts'
              : 'Generate new content ideas'}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const CalendarBox = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'quarter' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics' | 'content'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchYear, setSearchYear] = useState<string>(''); // State for search year
  const frenchDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const navigateToView = (date: Date, view: typeof calendarView) => {
    setCurrentDate(date);
    setCalendarView(view);
    setSelectedDate(date);
  };

  const goToPrevious = () => {
    setCurrentDate(prev => {
      switch(calendarView) {
        case 'week': return addWeeks(prev, -1);
        case 'month': return new Date(prev.setMonth(prev.getMonth() - 1));
        case 'quarter': return new Date(prev.setMonth(prev.getMonth() - 3));
        case 'year': return new Date(prev.setFullYear(prev.getFullYear() - 1));
        default: return prev;
      }
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      switch(calendarView) {
        case 'week': return addWeeks(prev, 1);
        case 'month': return new Date(prev.setMonth(prev.getMonth() + 1));
        case 'quarter': return new Date(prev.setMonth(prev.getMonth() + 3));
        case 'year': return new Date(prev.setFullYear(prev.getFullYear() + 1));
        default: return prev;
      }
    });
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
    setCalendarView('week');
  };

  const handleSearchYear = () => {
    const year = parseInt(searchYear, 10);
    if (!isNaN(year)) {
      const newDate = startOfYear(new Date(year, 0, 1));
      navigateToView(newDate, 'year');
    }
  };

  const renderCalendarHeader = () => {
    switch(calendarView) {
      case 'week': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`;
      }
      case 'month': return format(currentDate, 'MMMM yyyy');
      case 'quarter': return `${format(startOfQuarter(currentDate), 'MMMM yyyy')} - ${format(endOfQuarter(currentDate), 'MMMM yyyy')}`;
      case 'year': return format(currentDate, 'yyyy');
      default: return '';
    }
  };

  const CalendarGridView = () => {
    switch(calendarView) {
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

        return (
          <div className="flex h-[600px] border-t border-stroke dark:border-dark-3">
            <div className="w-32 border-r border-stroke dark:border-dark-3">
              {days.map((day, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedDate(day);
                    console.log('Selected day:', format(day, 'yyyy-MM-dd'));
                  }}
                  className={`h-24 p-3 text-center cursor-pointer transition-colors ${
                    isSameDay(day, new Date())
                      ? 'bg-primary/10 text-primary dark:text-primary-dark'
                      : 'text-dark dark:text-white'
                  } ${
                    isSameDay(day, selectedDate)
                      ? 'border-2 border-primary dark:border-primary-dark bg-primary/5'
                      : 'hover:bg-gray-100 dark:hover:bg-dark-2'
                  }`}
                >
                  <div className="text-sm font-medium">{frenchDays[index]}</div>
                  <div className="mt-1 text-2xl font-bold">{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              <div className="relative">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div 
                    key={hour}
                    className="h-24 border-b border-stroke dark:border-dark-3"
                  >
                    <div className="flex h-full items-center px-4">
                      <div className="w-16 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date().setHours(hour), 'HH:mm')}
                      </div>
                      <div className="ml-4 h-16 w-full rounded-lg bg-gray-100 dark:bg-gray-dark-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'month': {
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        const allDaysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
        const daysBefore = Array(firstDayOfMonth.getDay()).fill(null);
        const totalDays = [...daysBefore, ...allDaysInMonth];

        return (
          <tbody>
            {Array.from({ length: Math.ceil(totalDays.length / 7) }).map((_, weekIndex) => (
              <tr key={weekIndex} className="grid grid-cols-7">
                {totalDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                  <td
                    key={dayIndex}
                    onClick={() => day && navigateToView(day, 'week')}
                    className={`relative h-32 cursor-pointer border border-stroke p-2 transition-colors dark:border-dark-3 md:p-3 ${
                      !day ? 'bg-gray-1 dark:bg-gray-dark-1' : 'hover:bg-gray-2 dark:hover:bg-dark-2'
                    } ${
                      day && isSameDay(day, new Date()) ? 'bg-primary/10 dark:bg-primary-dark/20' : ''
                    } ${
                      day && isSameDay(day, selectedDate) 
                        ? 'border-2 border-primary dark:border-primary-dark'
                        : ''
                    }`}
                  >
                    {day && (
                      <>
                        <span className="block font-medium text-dark dark:text-white">
                          {format(day, 'd')}
                        </span>
                        <div className="mt-1 space-y-1">
                          {[0, 1].map((i) => (
                            <div key={i} className="h-4 rounded bg-gray-1 dark:bg-gray-dark-1" />
                          ))}
                        </div>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        );
      }

      case 'quarter': {
        return (
          <div className="grid grid-cols-3 gap-4 p-4">
            {Array.from({ length: 3 }).map((_, monthOffset) => {
              const monthDate = addMonths(startOfQuarter(currentDate), monthOffset);
                function setDate(date: Date, day: number): Date {
                const newDate = new Date(date);
                newDate.setDate(day);
                return newDate;
                }

              return (
                <div
                  key={monthOffset}
                  className="rounded-lg border border-stroke bg-gray-1 p-4 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-gray-dark-1"
                  onClick={() => navigateToView(monthDate, 'month')}
                >
                  <h3 className="mb-3 text-center font-semibold dark:text-white">
                    {format(monthDate, 'MMMM')}
                  </h3>
                  <div className="grid grid-cols-7 gap-1">
                    {eachDayOfInterval({
                      start: startOfMonth(monthDate),
                      end: setDate(endOfMonth(monthDate), 7),
                    }).map((day, i) => (
                      <div
                        key={i}
                        className={`flex h-8 items-center justify-center rounded text-sm ${
                          isSameDay(day, new Date())
                            ? 'bg-primary text-white dark:bg-primary-dark'
                            : 'hover:bg-gray-2 dark:hover:bg-dark-2'
                        }`}
                      >
                        {i < 7 ? format(day, 'EEEEE') : format(day, 'd')}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'year': {
        return (
          <table className="w-full">
            <thead>
              <tr>
                <th colSpan={4} className="p-4 text-center text-xl font-semibold dark:text-white">
                  {format(currentDate, 'yyyy')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[0, 1, 2, 3].map((row) => (
                <tr key={row} className="border-b border-stroke last:border-b-0 dark:border-dark-3">
                  {[0, 1, 2].map((col) => {
                    const monthIndex = row * 3 + col;
                    if (monthIndex >= 12) return null;
                    
                    const monthDate = addMonths(startOfYear(currentDate), monthIndex);
                    const monthStart = startOfMonth(monthDate);
                    const monthEnd = endOfMonth(monthDate);
                    const weeks = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
                      (day) => day.getDay() === 0
                    );
      
                    function isSameMonth(date1: Date, date2: Date): boolean {
                      return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
                    }

                    return (
                      <td
                        key={monthIndex}
                        className="w-1/4 p-4 align-top hover:bg-gray-2 dark:hover:bg-dark-2"
                        onClick={() => navigateToView(monthDate, 'month')}
                      >
                        <div className={`mb-2 text-center font-medium ${
                          isSameMonth(new Date(), monthDate)
                            ? 'text-primary dark:text-primary-dark'
                            : 'text-dark dark:text-white'
                        }`}>
                          {format(monthDate, 'MMMM')}
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                <th key={day} className="h-8 text-center font-medium">
                                  {day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {weeks.map((weekStart) => {
                              const weekDays = eachDayOfInterval({
                                start: weekStart,
                                end: addDays(weekStart, 6)
                              });
      
                              return (
                                <tr key={weekStart.toString()}>
                                  {weekDays.map((day, dayIndex) => {
                                    const isCurrentMonth = isSameMonth(day, monthDate);
                                    const isToday = isSameDay(day, new Date());
      
                                    return (
                                      <td
                                        key={dayIndex}
                                        className={`h-8 text-center text-sm ${
                                          !isCurrentMonth ? 'opacity-50' : ''
                                        } ${
                                          isToday
                                            ? 'rounded-full bg-primary text-white dark:bg-primary-dark'
                                            : 'text-dark dark:text-white'
                                        }`}
                                      >
                                        {isCurrentMonth ? format(day, 'd') : ''}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 transition-all hover:bg-gray-300 dark:bg-gray-dark-2 dark:hover:bg-gray-dark-3"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 transition-all hover:bg-gray-300 dark:bg-gray-dark-2 dark:hover:bg-gray-dark-3"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="ml-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:block">Today</span>
          </button>
        </div>

        <h2 className="text-xl font-semibold dark:text-white sm:text-2xl">
          {renderCalendarHeader()}
        </h2>

        <div className="flex flex-wrap gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCalendarView(view)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                calendarView === view
                  ? 'bg-primary text-white shadow-sm dark:bg-primary-dark'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-dark-2 dark:text-gray-300 dark:hover:bg-gray-dark-3'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Search by Year */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          value={searchYear}
          onChange={(e) => setSearchYear(e.target.value)}
          placeholder="Enter year (e.g., 2025)"
          className="w-40 rounded-lg border border-stroke p-2 text-sm dark:border-dark-3 dark:bg-gray-dark-2 dark:text-white"
        />
        <button
          onClick={handleSearchYear}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary"
        >
          Search
        </button>
      </div>

      <div className="mb-6 flex gap-4 border-b border-stroke dark:border-dark-3">
        {['Calendar', 'Analytics', 'Content Studio'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase() as any)}
            className={`pb-2 px-4 ${
              activeTab === tab.toLowerCase()
                ? 'border-b-2 border-primary text-primary dark:border-primary-dark dark:text-primary-dark'
                : 'text-dark hover:text-gray-600 dark:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-dark dark:shadow-card">
        {activeTab === 'calendar' ? (
          calendarView === 'month' ? (
            <table className="w-full">
              <thead>
                <tr className="grid grid-cols-7 bg-primary text-white">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <th key={day} className="p-3 text-sm font-medium">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              {CalendarGridView()}
            </table>
          ) : (
            CalendarGridView()
          )
        ) : activeTab === 'analytics' ? (
          <AnalyticsGrid currentDate={currentDate} calendarView={calendarView} />
        ) : (
          <ContentDashboard />
        )}
      </div>

      <div className="mt-8 border-t border-stroke pt-4 text-center dark:border-dark-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          PLANTIT BY BRAND AND COM
        </div>
        <div className="mt-2 flex justify-center gap-4">
          <a href="https://www.broadcast.com" className="text-primary hover:underline dark:text-primary-dark">
            Contact
          </a>
          <a href="https://www.broadcast.com" className="text-primary hover:underline dark:text-primary-dark">
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
};

export default CalendarBox;