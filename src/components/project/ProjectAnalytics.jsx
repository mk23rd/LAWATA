import React, { useMemo } from 'react';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiUsers, 
  FiCalendar,
  FiActivity,
  FiBarChart2,
  FiPieChart
} from 'react-icons/fi';
import { ProjectCard } from './ProjectCard';

/**
 * Project Analytics Dashboard
 * Shows funding trends, backer statistics, and project insights
 */
export const ProjectAnalytics = ({ project, funders = [] }) => {
  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!project || !funders.length) {
      return {
        totalFunding: 0,
        totalBackers: 0,
        averagePledge: 0,
        fundingPerDay: 0,
        daysActive: 0,
        progressRate: 0,
        topBackers: [],
        fundingByDate: [],
        backersOverTime: [],
        allContributions: []
      };
    }

    // Calculate days active
    const startDate = project.createdAt?.seconds 
      ? new Date(project.createdAt.seconds * 1000) 
      : new Date(project.startDate || Date.now());
    const today = new Date();
    const daysActive = Math.max(1, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));

    // Calculate funding per day
    const fundingPerDay = project.fundedMoney / daysActive;

    // Calculate average pledge
    const totalContributions = funders.reduce((sum, f) => sum + f.contributions.length, 0);
    const averagePledge = totalContributions > 0 ? project.fundedMoney / totalContributions : 0;

    // Calculate progress rate (% per day)
    const progressRate = (project.fundedMoney / project.fundingGoal) / daysActive * 100;

    // Get top backers
    const topBackers = [...funders]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    // Create funding timeline
    const allContributions = funders.flatMap(funder => 
      funder.contributions.map(c => ({
        amount: c.amount,
        date: c.date?.seconds ? new Date(c.date.seconds * 1000) : new Date(c.date),
        funderName: funder.name
      }))
    ).sort((a, b) => a.date - b.date);

    // Group by date for chart
    const fundingByDate = [];
    const backersOverTime = [];
    let cumulativeFunding = 0;
    let cumulativeBackers = new Set();

    allContributions.forEach(contrib => {
      cumulativeFunding += contrib.amount;
      cumulativeBackers.add(contrib.funderName);
      
      const dateStr = contrib.date.toLocaleDateString();
      fundingByDate.push({
        date: dateStr,
        amount: cumulativeFunding,
        dailyAmount: contrib.amount
      });
      
      backersOverTime.push({
        date: dateStr,
        count: cumulativeBackers.size
      });
    });

    return {
      totalFunding: project.fundedMoney,
      totalBackers: funders.length,
      averagePledge,
      fundingPerDay,
      daysActive,
      progressRate,
      topBackers,
      fundingByDate,
      backersOverTime,
      allContributions
    };
  }, [project, funders]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  // Calculate max value for chart scaling
  const maxFunding = Math.max(...analytics.fundingByDate.map(d => d.amount), project.fundingGoal);
  const maxBackers = Math.max(...analytics.backersOverTime.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <FiDollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
              Per Day
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Funding/Day</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.fundingPerDay)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <FiUsers className="w-8 h-8 text-green-600" />
            <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">
              Average
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Pledge</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.averagePledge)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <FiTrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
              Growth
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Progress Rate</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.progressRate)}%/day</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <FiCalendar className="w-8 h-8 text-orange-600" />
            <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">Days Active</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.daysActive}</p>
        </div>
      </div>

      {/* Funding Progress Chart - BAR CHART */}
      <ProjectCard title="Funding Progress Over Time" icon={FiBarChart2}>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current: {formatCurrency(analytics.totalFunding)}</span>
            <span className="text-gray-600">Goal: {formatCurrency(project.fundingGoal)}</span>
          </div>
          
          {analytics.fundingByDate.length > 0 ? (
            <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              {/* Y-axis labels - More values */}
              <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 pr-2">
                <span>{formatCurrency(maxFunding)}</span>
                <span>{formatCurrency(maxFunding * 0.875)}</span>
                <span>{formatCurrency(maxFunding * 0.75)}</span>
                <span>{formatCurrency(maxFunding * 0.625)}</span>
                <span>{formatCurrency(maxFunding * 0.5)}</span>
                <span>{formatCurrency(maxFunding * 0.375)}</span>
                <span>{formatCurrency(maxFunding * 0.25)}</span>
                <span>{formatCurrency(maxFunding * 0.125)}</span>
                <span>$0</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full relative">
                {/* Goal line */}
                <div 
                  className="absolute left-0 right-0 border-t-2 border-dashed border-green-500 z-10"
                  style={{ top: `${(1 - project.fundingGoal / maxFunding) * 100}%` }}
                >
                  <span className="absolute -top-2 right-0 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    Goal
                  </span>
                </div>

                {/* Grid lines - More lines */}
                {[0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map(ratio => (
                  <div 
                    key={ratio}
                    className="absolute left-0 right-0 border-t border-gray-300"
                    style={{ top: `${ratio * 100}%` }}
                  />
                ))}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end justify-between gap-2">
                  {analytics.fundingByDate.slice(-30).map((data, index) => {
                    const height = (data.amount / maxFunding) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-color-b to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer group relative"
                        style={{ height: `${height}%`, maxWidth: '96px' }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          {data.date}<br/>{formatCurrency(data.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis label */}
              <div className="absolute bottom-0 left-16 right-0 flex justify-between text-xs text-gray-500 mt-2">
                <span>Start</span>
                <span>Recent</span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiBarChart2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No funding data yet</p>
              </div>
            </div>
          )}
        </div>
      </ProjectCard>

      {/* Backers Growth Chart - BAR CHART */}
      <ProjectCard title="Backers Growth" icon={FiBarChart2}>
        {analytics.backersOverTime.length > 0 ? (
          <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            {/* Y-axis - More values */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>{maxBackers}</span>
              <span>{Math.floor(maxBackers * 0.875)}</span>
              <span>{Math.floor(maxBackers * 0.75)}</span>
              <span>{Math.floor(maxBackers * 0.625)}</span>
              <span>{Math.floor(maxBackers * 0.5)}</span>
              <span>{Math.floor(maxBackers * 0.375)}</span>
              <span>{Math.floor(maxBackers * 0.25)}</span>
              <span>{Math.floor(maxBackers * 0.125)}</span>
              <span>0</span>
            </div>

            {/* Bar chart */}
            <div className="ml-12 h-full relative">
              {/* Grid lines - More lines */}
              {[0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map(ratio => (
                <div 
                  key={ratio}
                  className="absolute left-0 right-0 border-t border-gray-300"
                  style={{ top: `${ratio * 100}%` }}
                />
              ))}

              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-between gap-2">
                {analytics.backersOverTime.slice(-30).map((data, index) => {
                  const height = (data.count / maxBackers) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t hover:from-purple-600 hover:to-purple-500 transition-all cursor-pointer group relative"
                      style={{ height: `${height}%`, maxWidth: '96px' }}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {data.date}<br/>{data.count} backer{data.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-500 mt-2">
              <span>Start</span>
              <span>Recent</span>
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FiBarChart2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No backer data yet</p>
            </div>
          </div>
        )}
      </ProjectCard>

      {/* Top Backers */}
      <ProjectCard title="Top Backers" icon={FiPieChart}>
        {analytics.topBackers.length > 0 ? (
          <div className="space-y-3">
            {analytics.topBackers.map((backer, index) => {
              const percentage = (backer.totalAmount / analytics.totalFunding) * 100;
              return (
                <div key={backer.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-color-b to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{backer.name}</p>
                        <p className="text-xs text-gray-500">{backer.contributions.length} contribution{backer.contributions.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(backer.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{formatNumber(percentage)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-color-b to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <FiUsers className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No backers yet</p>
          </div>
        )}
      </ProjectCard>

      {/* Recent Activity */}
      <ProjectCard title="Recent Contributions" icon={FiActivity}>
        {analytics.allContributions && analytics.allContributions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.allContributions.slice(-10).reverse().map((contrib, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{contrib.funderName}</p>
                  <p className="text-xs text-gray-500">{contrib.date.toLocaleDateString()} at {contrib.date.toLocaleTimeString()}</p>
                </div>
                <p className="font-bold text-color-b">{formatCurrency(contrib.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <FiActivity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No contributions yet</p>
          </div>
        )}
      </ProjectCard>

      {/* Insights */}
      <ProjectCard title="Project Insights" icon={FiTrendingUp}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">Funding Velocity</h4>
            <p className="text-sm text-gray-600 mb-2">
              At the current rate, you're raising {formatCurrency(analytics.fundingPerDay)} per day.
            </p>
            {analytics.fundingPerDay > 0 && (
              <p className="text-xs text-gray-500">
                {project.fundingGoal > project.fundedMoney 
                  ? `Estimated ${Math.ceil((project.fundingGoal - project.fundedMoney) / analytics.fundingPerDay)} days to reach goal`
                  : 'Goal reached! 🎉'}
              </p>
            )}
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-2">Backer Engagement</h4>
            <p className="text-sm text-gray-600 mb-2">
              Average of {formatNumber(analytics.totalFunding / analytics.totalBackers || 0)} per backer
            </p>
            <p className="text-xs text-gray-500">
              {analytics.totalBackers > 0 
                ? `${formatNumber((analytics.allContributions.length / analytics.totalBackers))} contributions per backer on average`
                : 'No backers yet'}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-2">Campaign Progress</h4>
            <p className="text-sm text-gray-600 mb-2">
              {formatNumber((project.fundedMoney / project.fundingGoal) * 100)}% funded
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(project.fundingGoal - project.fundedMoney)} remaining to reach goal
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h4 className="font-semibold text-gray-900 mb-2">Time Efficiency</h4>
            <p className="text-sm text-gray-600 mb-2">
              {formatNumber((project.fundedMoney / project.fundingGoal) / analytics.daysActive * 100)}% progress per day
            </p>
            <p className="text-xs text-gray-500">
              Campaign has been active for {analytics.daysActive} days
            </p>
          </div>
        </div>
      </ProjectCard>
    </div>
  );
};
