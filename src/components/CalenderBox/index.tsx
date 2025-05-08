"use client";

import React, { useState, useEffect } from 'react';
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
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCw } from 'lucide-react';

import * as postService from "@/services/postService";
import { useRouter } from 'next/navigation';
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { toast } from 'react-toastify';

interface Creator {
  id: string;
  name: string;
  type: 'client' | 'team_member';
}

interface ScheduledPost {
  id: string;
  title: string;
  platform: 'Facebook' | 'Instagram' | 'LinkedIn';
  scheduled_for: string;
  status?: 'published' | 'scheduled' | 'failed' | 'pending' | 'rejected';
  creator?: Creator;
}
interface AnalyticsData {
  period: string;
  posts: number;
  engagement: number;
}
const platformIcons = {
  Facebook: <FaFacebook className="text-blue-600" />,
  Instagram: <FaInstagram className="text-pink-500" />,
  LinkedIn: <FaLinkedin className="text-blue-700" />,
};

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

const PostTable = ({ posts, onRefresh, currentDate, calendarView }: { 
  posts: ScheduledPost[], 
  onRefresh: () => void,
  currentDate: Date,
  calendarView: 'week' | 'month' | 'quarter' | 'year'
}) => {
  // Filter posts based on the current calendar view and date
  const filterPostsByDateRange = (post: ScheduledPost) => {
    const postDate = new Date(post.scheduled_for);

    switch (calendarView) {
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return postDate >= weekStart && postDate <= weekEnd;
      }
      case 'month': {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return postDate >= monthStart && postDate <= monthEnd;
      }
      case 'quarter': {
        const quarterStart = startOfQuarter(currentDate);
        const quarterEnd = endOfQuarter(currentDate);
        return postDate >= quarterStart && postDate <= quarterEnd;
      }
      case 'year': {
        const yearStart = startOfYear(currentDate);
        const yearEnd = endOfYear(currentDate);
        return postDate >= yearStart && postDate <= yearEnd;
      }
      default:
        return true;
    }
  };

  // Apply the filter and then group by status
  const filteredPosts = posts.filter(filterPostsByDateRange);

  const scheduledPosts = filteredPosts.filter((post) => post.status === 'scheduled');
  const postedPosts = filteredPosts.filter((post) => post.status === 'published');
  const pendingPosts = filteredPosts.filter((post) => post.status === 'pending');
  const rejectedPosts = filteredPosts.filter((post) => post.status === 'rejected');

  // Rest of your component remains the same...
  const handleApprove = async (postId: string) => {
    try {
      await postService.approvePost(parseInt(postId));
      toast.success("Post approved successfully!");
      onRefresh();
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post.");
    }
  };

  const handleReject = async (postId: string) => {
    try {
      await postService.rejectPost(parseInt(postId));
      toast.success("Post rejected successfully!");
      onRefresh();
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post.");
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Pending Posts */}
      <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
        <h3 className="mb-4 text-lg font-semibold text-yellow-600 dark:text-yellow-300">
          Pending ({pendingPosts.length})
        </h3>
        {pendingPosts.length > 0 ? (
          pendingPosts.map((post) => (
            <div
              key={post.id}
              className="mb-2 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              <div className="flex justify-between">
                <span>{post.title}</span>
                <span className="text-xs">
                  {format(new Date(post.scheduled_for), 'PPpp')}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {platformIcons[post.platform]}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleApprove(post.id)}
                  className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(post.id)}
                  className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No pending posts.
          </p>
        )}
      </div>

      {/* Rejected Posts */}
      <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
        <h3 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-300">
          Rejected ({rejectedPosts.length})
        </h3>
        {rejectedPosts.length > 0 ? (
          rejectedPosts.map((post) => (
            <div
              key={post.id}
              className="mb-2 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200"
            >
              <div className="flex justify-between">
                <span>{post.title}</span>
                <span className="text-xs">
                  {format(new Date(post.scheduled_for), 'PPpp')}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {platformIcons[post.platform]}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No rejected posts.
          </p>
        )}
      </div>
      {/* Scheduled Posts */}
      <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
        <h3 className="mb-4 text-lg font-semibold text-primary dark:text-primary-dark">
          Scheduled ({scheduledPosts.length})
        </h3>
        {scheduledPosts.length > 0 ? (
          scheduledPosts.map((post) => (
            <div
              key={post.id}
              className="mb-2 rounded-lg bg-blue-100 p-3 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <div className="flex justify-between">
                <span>{post.title}</span>
                <span className="text-xs">
                  {format(new Date(post.scheduled_for), 'PPpp')}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {platformIcons[post.platform]}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No scheduled posts.
          </p>
        )}
      </div>

      {/* Posted Posts */}
      <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
        <h3 className="mb-4 text-lg font-semibold text-green-600 dark:text-green-300">
          Posted ({postedPosts.length})
        </h3>
        {postedPosts.length > 0 ? (
          postedPosts.map((post) => (
            <div
              key={post.id}
              className="mb-2 rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              <div className="flex justify-between">
                <span>{post.title}</span>
                <span className="text-xs">
                  {format(new Date(post.scheduled_for), 'PPpp')}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {platformIcons[post.platform]}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No posted posts.
          </p>
        )}
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
          {platformIcons[platform as keyof typeof platformIcons]}
        </button>
      ))}
    </div>

    <div className="mb-6 rounded-lg border border-stroke p-4 dark:border-dark-3">
      <h3 className="mb-4 text-lg font-semibold dark:text-white">Content Approval Status</h3>
      <div className="grid grid-cols-3 gap-4">
        {['Scheduled', 'Pending Approval', 'Approved'].map(status => (
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics' | 'content_studio' | 'post_table'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchYear, setSearchYear] = useState<string>('');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const frenchDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const router = useRouter();

  const platformIcons = {
    Facebook: <FaFacebook className="text-blue-600" />,
    Instagram: <FaInstagram className="text-pink-500" />,
    LinkedIn: <FaLinkedin className="text-blue-700" />,
  };

  const fetchScheduledPosts = async () => {
    setLoadingPosts(true);
    try {
      const posts = await postService.getScheduledPosts();
      setScheduledPosts(posts);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, [currentDate, calendarView]);

  const navigateToView = (date: Date, view: typeof calendarView) => {
    setCurrentDate(date);
    setCalendarView(view);
    setSelectedDate(date);
  };

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      switch (calendarView) {
        case 'week':
          return addWeeks(prev, -1);
        case 'month':
          return subMonths(prev, 1); // Use subMonths instead of setMonth
        case 'quarter':
          return subQuarters(prev, 1); // Use subQuarters instead of setMonth
        case 'year':
          return subYears(prev, 1); // Use subYears instead of setFullYear
        default:
          return prev;
      }
    });
  };
  
  const goToNext = () => {
    setCurrentDate((prev) => {
      switch (calendarView) {
        case 'week':
          return addWeeks(prev, 1);
        case 'month':
          return addMonths(prev, 1); // Use addMonths instead of setMonth
        case 'quarter':
          return addQuarters(prev, 1); // Use addQuarters instead of setMonth
        case 'year':
          return addYears(prev, 1); // Use addYears instead of setFullYear
        default:
          return prev;
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
                <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                <div className="mt-1 text-2xl font-bold">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            <div className="relative">
            {Array.from({ length: 24 }).map((_, hour) => (
  <div key={hour} className="h-24 border-b border-stroke dark:border-dark-3">
    <div className="flex h-full items-center px-4">
      <div className="w-16 text-sm text-gray-500 dark:text-gray-400">
        {format(new Date().setHours(hour), 'HH:mm')}
      </div>
      <div className="ml-4 h-16 w-full">
        {scheduledPosts
          .filter((post) => {
            const postDate = new Date(post.scheduled_for);
            return (
              isSameDay(postDate, selectedDate) && 
              postDate.getHours() === hour && // Compare with the current grid hour
              (post.status === 'scheduled' || post.status === 'published')
            );
          })
          .map((post) => (
                          <div
                            key={post.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(post);
                            }}
                            className={`mb-2 flex items-center gap-2 rounded-lg p-2 text-sm cursor-pointer transition-all ${
                              post.status === 'published'
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            } hover:shadow-md`}
                          >
                            {/* Icon */}
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-primary dark:bg-gray-700">
                              {post.status === 'published' ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16l-4-4m0 0l4-4m-4 4h16"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* Post Title and Platform */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1 truncate">
                                <span className="font-medium">{post.title}</span>
                              </div>
                              <div
                                className={`rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-2 ${
                                  post.platform === "Facebook"
                                    ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                                    : post.platform === "Instagram"
                                    ? "bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200"
                                    : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {platformIcons[post.platform]}
                              </div>
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/editPost/${post.id}`);
                              }}
                              className="ml-2 rounded-md bg-primary px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                    </div>
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
                          {scheduledPosts
                            .filter((post) => isSameDay(new Date(post.scheduled_for), day))
                            .slice(0, 2) // Limit to 2 posts per day
                            .map((post) => (
                              <div
                                key={post.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPost(post);
                                }}
                                className={`h-4 truncate rounded text-xs cursor-pointer px-2 py-1 ${
                                  new Date(post.scheduled_for) < new Date()
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}
                              >
                                {post.title}
                              </div>
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
            function subDays(date: Date, amount: number): Date {
              const newDate = new Date(date);
              newDate.setDate(newDate.getDate() - amount);
              return newDate;
            }

        return (
          <table className="w-full">
            <tbody>
              {[0, 1, 2, 3].map((row) => (
                <tr key={row} className="border-b border-stroke last:border-b-0 dark:border-dark-3">
                  {[0, 1, 2].map((col) => {
                    const monthIndex = row * 3 + col;
                    if (monthIndex >= 12) return null;
                    
                    const monthDate: Date = addMonths(startOfYear(currentDate), monthIndex);
                    const monthStart = startOfMonth(monthDate);
                    const monthEnd = endOfMonth(monthDate);
                    
                    // Get first day of month and calculate offset for week start
                    const firstDay = monthStart.getDay(); // 0 (Sun) to 6 (Sat)
                    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
                    
                    // Create complete weeks array (6 weeks to cover all possibilities)
                    const weeks = [];
                    let weekStartDate = subDays(monthStart, startOffset);
                    
                    for (let i = 0; i < 6; i++) {
                      weeks.push(weekStartDate);
                      weekStartDate = addDays(weekStartDate, 7);
                    }
      
                    function isSameMonth(date1: Date, date2: Date): boolean {
                      return date1.getFullYear() === date2.getFullYear() && 
                             date1.getMonth() === date2.getMonth();
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
                              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
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
          <button
            onClick={fetchScheduledPosts}
            disabled={loadingPosts}
            className="ml-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loadingPosts ? 'animate-spin' : ''}`} />
            <span className="hidden sm:block">Refresh</span>
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
        {['Calendar', 'Analytics', 'Content Studio', 'Posts Table'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '_') as any)}
            className={`pb-2 px-4 ${
              activeTab === tab.toLowerCase().replace(' ', '_')
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
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fr', 'Sat'].map((day) => (
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
        ) : activeTab === 'content_studio' ? (
          <ContentDashboard />
        ) : (
          <PostTable 
  posts={scheduledPosts} 
  onRefresh={fetchScheduledPosts} 
  currentDate={currentDate}
  calendarView={calendarView}
/>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-dark">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-300 p-4 dark:border-dark-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedPost.title}
              </h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Platform */}
              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-300">Platform:</span>{" "}
                <span className="flex items-center gap-2">
                  {platformIcons[selectedPost.platform]}
                </span>
              </p>

              {/* Scheduled For */}
              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-300">Scheduled for:</span>{" "}
                <span className="font-semibold text-primary dark:text-primary-dark">
                  {format(new Date(selectedPost.scheduled_for), "PPpp")}
                </span>
              </p>

              {/* Status */}
              <p className="text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-300">Status:</span>{" "}
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    selectedPost.status === "published"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : selectedPost.status === "scheduled"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : selectedPost.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {selectedPost.status ? selectedPost.status.charAt(0).toUpperCase() + selectedPost.status.slice(1) : 'Unknown'}
                </span>
              </p>

              {/* Creator */}
              {selectedPost.creator && (
                <p className="text-sm">
                  <span className="font-medium text-gray-600 dark:text-gray-300">Creator:</span>{" "}
                  <span className="font-semibold text-dark dark:text-white">
                    {selectedPost.creator.name} ({selectedPost.creator.type})
                  </span>
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-300 p-4 dark:border-dark-3">
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-dark-3 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-dark-2"
              >
                Close
              </button>
              <button
                onClick={() => router.push(`/editPost/${selectedPost?.id}`)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Edit Post
              </button>
              <button
                onClick={async () => {
                  if (selectedPost) {
                    const confirmDelete = window.confirm(
                      `Are you sure you want to delete the post titled "${selectedPost.title}"?`
                    );
                    if (confirmDelete) {
                      try {
                        await postService.deletePost(parseInt(selectedPost.id));
                        
                        setSelectedPost(null);
                        fetchScheduledPosts(); // Refresh the scheduled posts
                      } catch (error) {
                        console.error("Error deleting post:", error);
                        
                      }
                    }
                  }
                }}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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

function subYears(date: Date, amount: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() - amount);
  return newDate;
}

export default CalendarBox;
function addQuarters(date: Date, amount: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + amount * 3);
  return newDate;
}
function addYears(date: Date, amount: number): Date {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + amount);
  return newDate;
}

