import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReviewsDashboard = ({ restaurantId, restaurantName }) => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minRating, setMinRating] = useState('');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (minRating) params.append('min_rating', minRating);

      const [feedbackRes, statsRes] = await Promise.all([
        axios.get(`/api/feedback/restaurant/${restaurantId}?${params.toString()}`),
        axios.get(`/api/feedback/stats/${restaurantId}?${params.toString()}`)
      ]);

      if (feedbackRes.data.success) {
        setFeedback(feedbackRes.data.feedback);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setDistribution(statsRes.data.distribution);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchFeedback();
    }
  }, [restaurantId, startDate, endDate, minRating]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      await axios.delete(`/api/feedback/${id}`);
      fetchFeedback();
    } catch (err) {
      alert('Failed to delete feedback');
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 60, 150);
    doc.text('Customer Feedback Report', pageWidth / 2, 20, { align: 'center' });

    // Restaurant Name
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(restaurantName || 'Restaurant', pageWidth / 2, 28, { align: 'center' });

    // Date Range
    doc.setFontSize(10);
    const dateRange = startDate || endDate 
      ? `Period: ${startDate || 'Start'} to ${endDate || 'End'}`
      : `Generated: ${new Date().toLocaleDateString()}`;
    doc.text(dateRange, pageWidth / 2, 35, { align: 'center' });

    // Summary Statistics
    if (stats) {
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text('Summary Statistics', 14, 45);

      doc.autoTable({
        startY: 50,
        head: [['Metric', 'Value']],
        body: [
          ['Total Reviews', stats.total_reviews || 0],
          ['Overall Rating', stats.overall_rating ? `${parseFloat(stats.overall_rating).toFixed(2)} / 5.00` : 'N/A'],
          ['Food Quality', stats.avg_food_quality ? `${parseFloat(stats.avg_food_quality).toFixed(2)} / 5.00` : 'N/A'],
          ['Service', stats.avg_service ? `${parseFloat(stats.avg_service).toFixed(2)} / 5.00` : 'N/A'],
          ['Ambiance', stats.avg_ambiance ? `${parseFloat(stats.avg_ambiance).toFixed(2)} / 5.00` : 'N/A'],
          ['Pricing', stats.avg_pricing ? `${parseFloat(stats.avg_pricing).toFixed(2)} / 5.00` : 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }

    // Rating Distribution
    if (distribution) {
      const finalY = doc.lastAutoTable.finalY || 50;
      doc.setFontSize(12);
      doc.text('Rating Distribution', 14, finalY + 15);

      doc.autoTable({
        startY: finalY + 20,
        head: [['Stars', 'Count', 'Percentage']],
        body: [
          ['⭐⭐⭐⭐⭐ (5 Stars)', distribution.five_star || 0, `${((distribution.five_star || 0) / (stats.total_reviews || 1) * 100).toFixed(1)}%`],
          ['⭐⭐⭐⭐ (4 Stars)', distribution.four_star || 0, `${((distribution.four_star || 0) / (stats.total_reviews || 1) * 100).toFixed(1)}%`],
          ['⭐⭐⭐ (3 Stars)', distribution.three_star || 0, `${((distribution.three_star || 0) / (stats.total_reviews || 1) * 100).toFixed(1)}%`],
          ['⭐⭐ (2 Stars)', distribution.two_star || 0, `${((distribution.two_star || 0) / (stats.total_reviews || 1) * 100).toFixed(1)}%`],
          ['⭐ (1 Star)', distribution.one_star || 0, `${((distribution.one_star || 0) / (stats.total_reviews || 1) * 100).toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
    }

    // Customer Reviews
    if (feedback.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 50;
      doc.addPage();
      doc.setFontSize(12);
      doc.text('Customer Reviews', 14, 20);

      const reviewData = feedback.map(f => {
        const avgRating = ((f.food_quality + f.service + f.ambiance + f.pricing) / 4).toFixed(1);
        return [
          f.customer_name || 'Anonymous',
          `${avgRating} ⭐`,
          new Date(f.created_at).toLocaleDateString(),
          f.comments ? f.comments.substring(0, 60) + (f.comments.length > 60 ? '...' : '') : '-'
        ];
      });

      doc.autoTable({
        startY: 25,
        head: [['Phone', 'Rating', 'Date', 'Comments']],
        body: reviewData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' }
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `feedback-report-${restaurantName?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const downloadCSV = () => {
    const csvData = feedback.map(f => ({
      'Phone Number': f.phone_number || 'Not provided',
      'Food Quality': f.food_quality,
      'Service': f.service,
      'Ambiance': f.ambiance,
      'Pricing': f.pricing,
      'Overall Rating': ((f.food_quality + f.service + f.ambiance + f.pricing) / 4).toFixed(2),
      'Comments': f.comments || '',
      'Date': new Date(f.created_at).toLocaleString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback-${restaurantName?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setMinRating('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  // Chart Data
  const categoryRatingsData = stats ? {
    labels: ['Food Quality', 'Service', 'Ambiance', 'Pricing'],
    datasets: [{
      label: 'Average Rating',
      data: [
        parseFloat(stats.avg_food_quality || 0),
        parseFloat(stats.avg_service || 0),
        parseFloat(stats.avg_ambiance || 0),
        parseFloat(stats.avg_pricing || 0)
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  } : null;

  const distributionData = distribution ? {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [{
      data: [
        distribution.five_star || 0,
        distribution.four_star || 0,
        distribution.three_star || 0,
        distribution.two_star || 0,
        distribution.one_star || 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(59, 130, 246)',
        'rgb(245, 158, 11)',
        'rgb(251, 146, 60)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Feedback Dashboard</h1>
        <p className="text-gray-600">{restaurantName}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold mt-1">{stats.total_reviews || 0}</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Overall Rating</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.overall_rating ? parseFloat(stats.overall_rating).toFixed(2) : 'N/A'}
                  <span className="text-lg ml-1">/ 5</span>
                </p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Food Quality</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.avg_food_quality ? parseFloat(stats.avg_food_quality).toFixed(2) : 'N/A'}
                  <span className="text-lg ml-1">/ 5</span>
                </p>
              </div>
              <div className="bg-yellow-400 bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Service</p>
                <p className="text-3xl font-bold mt-1">
                  {stats.avg_service ? parseFloat(stats.avg_service).toFixed(2) : 'N/A'}
                  <span className="text-lg ml-1">/ 5</span>
                </p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Average Ratings Chart */}
        {categoryRatingsData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Ratings by Category</h2>
            <Bar
              data={categoryRatingsData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: { stepSize: 1 }
                  }
                },
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        )}

        {/* Rating Distribution Chart */}
        {distributionData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
            <Doughnut
              data={distributionData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            Download PDF Report
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Feedback ({feedback.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ambiance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No feedback found
                  </td>
                </tr>
              ) : (
                feedback.map((item) => {
                  const avgRating = ((item.food_quality + item.service + item.ambiance + item.pricing) / 4).toFixed(1);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.phone_number || 'Not provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {'⭐'.repeat(item.food_quality)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {'⭐'.repeat(item.service)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {'⭐'.repeat(item.ambiance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {'⭐'.repeat(item.pricing)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {avgRating} ⭐
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {item.comments || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReviewsDashboard;

