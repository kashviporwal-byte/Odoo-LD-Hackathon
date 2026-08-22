import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const BudgetBreakdown = () => {
  const { tripId } = useParams();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgetDetails = async () => {
      try {
        const res = await api.get(`/budget/${tripId}`);
        setBudget(res.data.data);
      } catch (err) {
        console.error('Failed to get budget metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBudgetDetails();
  }, [tripId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading budget breakdowns...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trip Expenses & Budget</h1>
        <Link to={`/trips/${tripId}`} className="text-sm font-semibold text-primary-600 hover:text-primary-500">
          &larr; Back to itinerary
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-gray-400 block uppercase">Total Cost</span>
          <span className="text-3xl font-extrabold text-gray-900">${budget?.totalCost || 0}</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-gray-400 block uppercase">Daily Average</span>
          <span className="text-3xl font-extrabold text-gray-900">${budget?.dailyAverage || 0}</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-gray-400 block uppercase font-bold text-red-500">Over-Budget Days</span>
          <span className="text-3xl font-extrabold text-red-600">{budget?.overBudgetDays?.length || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category breakdown bar charts mockup */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Expense Categories</h2>
          <div className="space-y-4">
            {Object.entries(budget?.byCategory || {}).map(([category, val]) => (
              <div key={category}>
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1">
                  <span className="capitalize">{category}</span>
                  <span>${val}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div 
                    className="bg-primary-500 h-3 rounded-full" 
                    style={{ width: `${budget?.totalCost > 0 ? (val / budget.totalCost) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning card panel */}
        <div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Budget Alerts</h2>
            {budget?.overBudgetDays?.length === 0 ? (
              <p className="text-sm text-green-600 font-semibold">🎉 Looking good! You are within limits for all days.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-semibold">⚠️ The following days exceed threshold allowances:</p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
                  {budget?.overBudgetDays?.map((day, idx) => (
                    <li key={idx}>Day {day}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetBreakdown;
