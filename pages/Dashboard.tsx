import React from 'react';
import { PaperRoll, StockStatus } from '../types';
import StatCard from '../components/StatCard';
import { Package, Truck, AlertCircle, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  inventory: PaperRoll[];
}

const Dashboard: React.FC<DashboardProps> = ({ inventory }) => {
  const inStock = inventory.filter(r => r.status === StockStatus.IN_STOCK);
  const shipped = inventory.filter(r => r.status === StockStatus.SHIPPED);
  
  // Calculate top customers/orders
  const orderCounts: Record<string, number> = {};
  inStock.forEach(item => {
    orderCounts[item.customerOrderNumber] = (orderCounts[item.customerOrderNumber] || 0) + 1;
  });

  const chartData = Object.keys(orderCounts)
    .map(key => ({ name: key, value: orderCounts[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Tableau de Bord</h2>
        <p className="text-slate-500">Aperçu général du stock et des mouvements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="En Stock"
          value={inStock.length}
          icon={<Package size={24} />}
          color="blue"
          trend="Bobines disponibles"
        />
        <StatCard
          title="Expédiés (Total)"
          value={shipped.length}
          icon={<Truck size={24} />}
          color="green"
          trend="Depuis le début"
        />
        <StatCard
          title="Commandes Actives"
          value={Object.keys(orderCounts).length}
          icon={<Calendar size={24} />}
          color="purple"
          trend="En attente de livraison"
        />
        <StatCard
          title="Alertes Stock"
          value={0}
          icon={<AlertCircle size={24} />}
          color="amber"
          trend="Tout semble normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Stock par Commande (Top 5)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Activité Récente</h3>
          <div className="overflow-y-auto max-h-64 no-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Bobine</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.slice(0, 7).map((roll) => (
                  <tr key={roll.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{roll.rollNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        roll.status === StockStatus.IN_STOCK 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {roll.status === StockStatus.IN_STOCK ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(roll.dateOut || roll.dateIn).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventory.length === 0 && (
                <div className="text-center py-8 text-slate-400">Aucune donnée récente</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;