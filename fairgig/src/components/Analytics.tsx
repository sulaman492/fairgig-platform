// components/Analytics.tsx
import React, { useState } from 'react';

interface WorkerData {
  id: string;
  name: string;
  profession: string;
  city: string;
  platform: 'Uber' | 'Fiverr' | 'DoorDash' | 'Upwork';
  monthlySalaries: { month: string; salary: number }[];
  previousSalary: number;
  currentSalary: number;
  growthRate: number;
}

interface ComparisonData {
  label: string;
  values: { month: string; value: number }[];
  color: string;
}

const Analytics: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'individual' | 'city' | 'profession' | 'platform'>('individual');
  const [selectedIndividual, setSelectedIndividual] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'6months' | '1year' | '2years'>('6months');

  // Mock data for workers
  const workersData: WorkerData[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      profession: 'Software Developer',
      city: 'San Francisco',
      platform: 'Upwork',
      monthlySalaries: [
        { month: 'Jan', salary: 5200 },
        { month: 'Feb', salary: 5450 },
        { month: 'Mar', salary: 5800 },
        { month: 'Apr', salary: 6100 },
        { month: 'May', salary: 6500 },
        { month: 'Jun', salary: 6800 },
      ],
      previousSalary: 5200,
      currentSalary: 6800,
      growthRate: 30.77,
    },
    {
      id: '2',
      name: 'Michael Chen',
      profession: 'Graphic Designer',
      city: 'New York',
      platform: 'Fiverr',
      monthlySalaries: [
        { month: 'Jan', salary: 3100 },
        { month: 'Feb', salary: 3250 },
        { month: 'Mar', salary: 3400 },
        { month: 'Apr', salary: 3600 },
        { month: 'May', salary: 3850 },
        { month: 'Jun', salary: 4100 },
      ],
      previousSalary: 3100,
      currentSalary: 4100,
      growthRate: 32.26,
    },
    {
      id: '3',
      name: 'Emma Davis',
      profession: 'Delivery Driver',
      city: 'Chicago',
      platform: 'DoorDash',
      monthlySalaries: [
        { month: 'Jan', salary: 2800 },
        { month: 'Feb', salary: 2900 },
        { month: 'Mar', salary: 3050 },
        { month: 'Apr', salary: 3150 },
        { month: 'May', salary: 3300 },
        { month: 'Jun', salary: 3450 },
      ],
      previousSalary: 2800,
      currentSalary: 3450,
      growthRate: 23.21,
    },
    {
      id: '4',
      name: 'James Wilson',
      profession: 'Rideshare Driver',
      city: 'San Francisco',
      platform: 'Uber',
      monthlySalaries: [
        { month: 'Jan', salary: 4200 },
        { month: 'Feb', salary: 4350 },
        { month: 'Mar', salary: 4500 },
        { month: 'Apr', salary: 4700 },
        { month: 'May', salary: 4900 },
        { month: 'Jun', salary: 5100 },
      ],
      previousSalary: 4200,
      currentSalary: 5100,
      growthRate: 21.43,
    },
    {
      id: '5',
      name: 'Maria Garcia',
      profession: 'Content Writer',
      city: 'Austin',
      platform: 'Upwork',
      monthlySalaries: [
        { month: 'Jan', salary: 3500 },
        { month: 'Feb', salary: 3700 },
        { month: 'Mar', salary: 3900 },
        { month: 'Apr', salary: 4200 },
        { month: 'May', salary: 4500 },
        { month: 'Jun', salary: 4800 },
      ],
      previousSalary: 3500,
      currentSalary: 4800,
      growthRate: 37.14,
    },
    {
      id: '6',
      name: 'David Kim',
      profession: 'Rideshare Driver',
      city: 'Austin',
      platform: 'Uber',
      monthlySalaries: [
        { month: 'Jan', salary: 3800 },
        { month: 'Feb', salary: 3950 },
        { month: 'Mar', salary: 4100 },
        { month: 'Apr', salary: 4300 },
        { month: 'May', salary: 4550 },
        { month: 'Jun', salary: 4750 },
      ],
      previousSalary: 3800,
      currentSalary: 4750,
      growthRate: 25.0,
    },
  ];

  // City aggregation data
  const cityData = [
    { city: 'San Francisco', avgSalary: 5950, growthRate: 26.1, workerCount: 2 },
    { city: 'New York', avgSalary: 4100, growthRate: 32.26, workerCount: 1 },
    { city: 'Chicago', avgSalary: 3450, growthRate: 23.21, workerCount: 1 },
    { city: 'Austin', avgSalary: 4775, growthRate: 31.07, workerCount: 2 },
  ];

  // Profession aggregation data
  const professionData = [
    { profession: 'Software Developer', avgSalary: 6800, growthRate: 30.77, workerCount: 1 },
    { profession: 'Graphic Designer', avgSalary: 4100, growthRate: 32.26, workerCount: 1 },
    { profession: 'Delivery Driver', avgSalary: 3450, growthRate: 23.21, workerCount: 1 },
    { profession: 'Rideshare Driver', avgSalary: 4925, growthRate: 23.22, workerCount: 2 },
    { profession: 'Content Writer', avgSalary: 4800, growthRate: 37.14, workerCount: 1 },
  ];

  // Platform comparison data
  const platformComparison: ComparisonData[] = [
    {
      label: 'Upwork',
      values: [
        { month: 'Jan', value: 4350 },
        { month: 'Feb', value: 4575 },
        { month: 'Mar', value: 4850 },
        { month: 'Apr', value: 5150 },
        { month: 'May', value: 5500 },
        { month: 'Jun', value: 5800 },
      ],
      color: '#14b89c',
    },
    {
      label: 'Fiverr',
      values: [
        { month: 'Jan', value: 3100 },
        { month: 'Feb', value: 3250 },
        { month: 'Mar', value: 3400 },
        { month: 'Apr', value: 3600 },
        { month: 'May', value: 3850 },
        { month: 'Jun', value: 4100 },
      ],
      color: '#ff6b4a',
    },
    {
      label: 'Uber',
      values: [
        { month: 'Jan', value: 4000 },
        { month: 'Feb', value: 4150 },
        { month: 'Mar', value: 4300 },
        { month: 'Apr', value: 4500 },
        { month: 'May', value: 4725 },
        { month: 'Jun', value: 4925 },
      ],
      color: '#f5a623',
    },
    {
      label: 'DoorDash',
      values: [
        { month: 'Jan', value: 2800 },
        { month: 'Feb', value: 2900 },
        { month: 'Mar', value: 3050 },
        { month: 'Apr', value: 3150 },
        { month: 'May', value: 3300 },
        { month: 'Jun', value: 3450 },
      ],
      color: '#9b59b6',
    },
  ];

  const getFilteredData = () => {
    if (selectedView === 'individual') {
      if (selectedIndividual === 'all') return workersData;
      return workersData.filter(w => w.id === selectedIndividual);
    }
    if (selectedView === 'city') {
      if (selectedCity === 'all') return cityData;
      return cityData.filter(c => c.city === selectedCity);
    }
    if (selectedView === 'profession') {
      if (selectedProfession === 'all') return professionData;
      return professionData.filter(p => p.profession === selectedProfession);
    }
    return [];
  };

  const getComparisonChart = () => {
    if (selectedView === 'platform') {
      return platformComparison;
    }
    
    if (selectedView === 'city') {
      const filtered = selectedCity === 'all' ? cityData : cityData.filter(c => c.city === selectedCity);
      return filtered.map(city => ({
        label: city.city,
        values: workersData
          .filter(w => w.city === city.city)
          .flatMap(w => w.monthlySalaries)
          .reduce((acc, curr, idx, arr) => {
            if (idx % 6 === 0) {
              const monthAvg = arr.slice(idx, idx + 6).reduce((sum, m) => sum + m.salary, 0) / 6;
              return [...acc, { month: curr.month, value: monthAvg }];
            }
            return acc;
          }, [] as { month: string; value: number }[]),
        color: '#14b89c',
      }));
    }
    
    return [];
  };

  const maxSalary = Math.max(
    ...workersData.flatMap(w => w.monthlySalaries.map(m => m.salary))
  );

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>📊 Salary Analytics Dashboard</h2>
        <div className="view-selector">
          <button className={`view-btn ${selectedView === 'individual' ? 'active' : ''}`} onClick={() => setSelectedView('individual')}>
            👤 Individual
          </button>
          <button className={`view-btn ${selectedView === 'city' ? 'active' : ''}`} onClick={() => setSelectedView('city')}>
            🏙️ By City
          </button>
          <button className={`view-btn ${selectedView === 'profession' ? 'active' : ''}`} onClick={() => setSelectedView('profession')}>
            💼 By Profession
          </button>
          <button className={`view-btn ${selectedView === 'platform' ? 'active' : ''}`} onClick={() => setSelectedView('platform')}>
            🚀 Platform Comparison
          </button>
        </div>
        <div className="time-range-selector">
          <button className={`time-btn ${timeRange === '6months' ? 'active' : ''}`} onClick={() => setTimeRange('6months')}>
            Last 6 Months
          </button>
          <button className={`time-btn ${timeRange === '1year' ? 'active' : ''}`} onClick={() => setTimeRange('1year')}>
            Last Year
          </button>
          <button className={`time-btn ${timeRange === '2years' ? 'active' : ''}`} onClick={() => setTimeRange('2years')}>
            Last 2 Years
          </button>
        </div>
      </div>

      {/* Filters */}
      {selectedView === 'individual' && (
        <div className="filter-bar">
          <select value={selectedIndividual} onChange={(e) => setSelectedIndividual(e.target.value)}>
            <option value="all">All Individuals</option>
            {workersData.map(w => (
              <option key={w.id} value={w.id}>{w.name} - {w.profession}</option>
            ))}
          </select>
        </div>
      )}

      {selectedView === 'city' && (
        <div className="filter-bar">
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            <option value="all">All Cities</option>
            {[...new Set(workersData.map(w => w.city))].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      )}

      {selectedView === 'profession' && (
        <div className="filter-bar">
          <select value={selectedProfession} onChange={(e) => setSelectedProfession(e.target.value)}>
            <option value="all">All Professions</option>
            {[...new Set(workersData.map(w => w.profession))].map(prof => (
              <option key={prof} value={prof}>{prof}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid-analytics">
        <div className="stat-card-analytics">
          <div className="stat-icon">📈</div>
          <div className="stat-value">+28.5%</div>
          <div className="stat-label">Avg Salary Growth</div>
        </div>
        <div className="stat-card-analytics">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{workersData.length}</div>
          <div className="stat-label">Active Workers</div>
        </div>
        <div className="stat-card-analytics">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">$5,800</div>
          <div className="stat-label">Highest Salary</div>
        </div>
        <div className="stat-card-analytics">
          <div className="stat-icon">📊</div>
          <div className="stat-value">37.14%</div>
          <div className="stat-label">Top Growth Rate</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <h3>Salary Trend Analysis</h3>
        <div className="bar-chart-analytics">
          {selectedView === 'platform' ? (
            // Platform comparison line chart simulation
            <div className="line-chart">
              <svg width="100%" height="300" viewBox="0 0 800 300" preserveAspectRatio="none">
                {platformComparison.map((platform, idx) => {
                  const points = platform.values.map((v, i) => {
                    const x = (i / 5) * 780 + 10;
                    const y = 280 - (v / maxSalary) * 260;
                    return `${x},${y}`;
                  }).join(' ');
                  return (
                    <polyline key={idx} points={points} stroke={platform.color} strokeWidth="2" fill="none" />
                  );
                })}
                {platformComparison.map((platform, idx) => (
                  <text key={`label-${idx}`} x="10" y={20 + idx * 20} fill={platform.color} fontSize="12">
                    ● {platform.label}
                  </text>
                ))}
              </svg>
              <div className="x-axis">
                {platformComparison[0]?.values.map((v, i) => (
                  <span key={i}>{v.month}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="comparison-bars">
              {(selectedView === 'individual' && selectedIndividual === 'all' ? workersData : 
                selectedView === 'city' ? cityData :
                selectedView === 'profession' ? professionData :
                getFilteredData()
              ).map((item: any, idx) => (
                <div key={idx} className="bar-item">
                  <div className="bar-label">{item.name || item.city || item.profession}</div>
                  <div className="bar-wrapper">
                    <div 
                      className="bar current-bar" 
                      style={{ height: `${(item.currentSalary || item.avgSalary || 0) / maxSalary * 200}px` }}
                    >
                      <span className="bar-value">${item.currentSalary || item.avgSalary}</span>
                    </div>
                    <div 
                      className="bar previous-bar" 
                      style={{ height: `${(item.previousSalary || (item.avgSalary * 0.75)) / maxSalary * 200}px` }}
                    >
                      <span className="bar-value">${item.previousSalary || Math.round(item.avgSalary * 0.75)}</span>
                    </div>
                  </div>
                  <div className="growth-badge positive">+{item.growthRate || Math.round(Math.random() * 30)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="chart-legend">
          <span className="legend-current">● Current Salary</span>
          <span className="legend-previous">● Previous Period</span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="comparison-table-container">
        <h3>Detailed Comparison Analysis</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>{selectedView === 'individual' ? 'Worker' : selectedView === 'city' ? 'City' : 'Profession'}</th>
              <th>Previous Salary</th>
              <th>Current Salary</th>
              <th>Absolute Change</th>
              <th>Growth Rate</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {selectedView === 'platform' ? (
              platformComparison.map(platform => {
                const startSalary = platform.values[0].value;
                const endSalary = platform.values[platform.values.length - 1].value;
                const change = endSalary - startSalary;
                const growthRate = (change / startSalary) * 100;
                return (
                  <tr key={platform.label}>
                    <td><strong>{platform.label}</strong></td>
                    <td>${startSalary}</td>
                    <td>${endSalary}</td>
                    <td className={change > 0 ? 'positive' : 'negative'}>+${change}</td>
                    <td className={growthRate > 0 ? 'positive' : 'negative'}>{growthRate.toFixed(1)}%</td>
                    <td className="trend-up">📈 Growing</td>
                  </tr>
                );
              })
            ) : (
              (selectedView === 'individual' && selectedIndividual === 'all' ? workersData : 
               selectedView === 'city' ? cityData.map(city => ({
                 ...city,
                 name: city.city,
                 currentSalary: city.avgSalary,
                 previousSalary: city.avgSalary / (1 + city.growthRate / 100),
                 growthRate: city.growthRate
               })) :
               selectedView === 'profession' ? professionData.map(prof => ({
                 ...prof,
                 name: prof.profession,
                 currentSalary: prof.avgSalary,
                 previousSalary: prof.avgSalary / (1 + prof.growthRate / 100),
                 growthRate: prof.growthRate
               })) :
               []
              )).map((item: any) => {
                const change = item.currentSalary - (item.previousSalary || item.currentSalary / 1.3);
                const growth = ((item.currentSalary - (item.previousSalary || item.currentSalary / 1.3)) / (item.previousSalary || item.currentSalary / 1.3)) * 100;
                return (
                  <tr key={item.id || item.name}>
                    <td><strong>{item.name || item.city || item.profession}</strong></td>
                    <td>${Math.round(item.previousSalary || item.currentSalary / 1.3)}</td>
                    <td>${Math.round(item.currentSalary)}</td>
                    <td className={change > 0 ? 'positive' : 'negative'}>+${Math.round(change)}</td>
                    <td className={growth > 0 ? 'positive' : 'negative'}>{growth.toFixed(1)}%</td>
                    <td className={growth > 20 ? 'trend-up' : 'trend-stable'}>
                      {growth > 20 ? '🚀 Rapid Growth' : growth > 10 ? '📈 Steady Growth' : '📊 Stable'}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      {/* Insights Panel */}
      <div className="insights-panel">
        <h3>🧠 AI-Powered Insights</h3>
        <div className="insights-grid">
          <div className="insight-card-analytics">
            <div className="insight-icon">🏙️</div>
            <div className="insight-text">
              <h4>Top Performing City</h4>
              <p>San Francisco shows highest average salary growth at +26.1%, driven by tech sector demand.</p>
            </div>
          </div>
          <div className="insight-card-analytics">
            <div className="insight-icon">💼</div>
            <div className="insight-text">
              <h4>Fastest Growing Profession</h4>
              <p>Content Writers lead with 37.14% growth, indicating high demand for digital content.</p>
            </div>
          </div>
          <div className="insight-card-analytics">
            <div className="insight-icon">🚀</div>
            <div className="insight-text">
              <h4>Platform Winner</h4>
              <p>Upwork workers earn 41% more than Fiverr, with stronger growth trajectory.</p>
            </div>
          </div>
          <div className="insight-card-analytics">
            <div className="insight-icon">📊</div>
            <div className="insight-text">
              <h4>City vs Riders Comparison</h4>
              <p>San Francisco riders earn 32% more than Chicago riders, highlighting location impact.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;