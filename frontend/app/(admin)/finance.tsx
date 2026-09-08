import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';
import AdminDrawer from '../../components/AdminDrawer';

interface FinancialSummary {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  refunds: number;
}

interface RevenueGraphItem {
  period: string;
  revenue: number;
  commission: number;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  workerName: string;
  workerPhone: string;
  category: string;
  totalAmount: number;
  platformCommission: number;
  workerPayout: number;
  paymentMethod: string;
  status: string;
}

export default function FinancialCenter() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [graphData, setGraphData] = useState<RevenueGraphItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/finance');
      if (res.data?.success) {
        setSummary(res.data.data.summary);
        setGraphData(res.data.data.revenueGraph || []);
        setInvoices(res.data.data.invoices || []);
      }
    } catch (e) {
      console.error('Error fetching financial records:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const handleExportCSV = async () => {
    if (invoices.length === 0) {
      Alert.alert('No Records', 'There are no transactions to export yet.');
      return;
    }

    const headers = 'Invoice No,Date,Customer,Worker,Category,Total Amount (INR),Platform Commission (INR),Worker Payout (INR),Status\n';
    const rows = invoices.map(i => 
      `"${i.invoiceNumber}","${new Date(i.date).toLocaleDateString()}","${i.customerName}","${i.workerName}","${i.category}",${i.totalAmount},${i.platformCommission},${i.workerPayout},"${i.status}"`
    ).join('\n');

    const csvContent = headers + rows;

    try {
      if (Platform.OS === 'web') {
        // Web export: copy to clipboard or alert
        navigator.clipboard?.writeText(csvContent);
        Alert.alert('Export Successful', `Exported ${invoices.length} transaction records! CSV copied to clipboard.`);
      } else {
        // Mobile share sheet
        await Share.share({
          title: 'RapidFix Financial Report',
          message: csvContent,
        });
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Unable to share report');
    }
  };

  const maxBarValue = Math.max(...graphData.map(g => g.revenue), 500);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Complete Financial Center</Text>
          <Text style={styles.headerSubtitle}>Commission Engine, Graphs & Invoices</Text>
        </View>
        <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExportCSV}>
          <Ionicons name="download-outline" size={18} color="#2563EB" />
          <Text style={styles.exportHeaderBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Compiling financial statements...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Top Revenue Summary Cards */}
          <View style={styles.revenueGrid}>
            <View style={[styles.revCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
              <Text style={styles.revCardLabel}>TODAY'S REVENUE</Text>
              <Text style={[styles.revCardVal, { color: '#1D4ED8' }]}>₹{summary?.todayRevenue || 0}</Text>
              <Text style={styles.revCardSub}>Platform 10% share</Text>
            </View>

            <View style={[styles.revCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
              <Text style={styles.revCardLabel}>WEEKLY REVENUE</Text>
              <Text style={[styles.revCardVal, { color: '#15803D' }]}>₹{summary?.weeklyRevenue || 0}</Text>
              <Text style={styles.revCardSub}>Last 7 calendar days</Text>
            </View>
          </View>

          <View style={[styles.revenueGrid, { marginTop: 10 }]}>
            <View style={[styles.revCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}>
              <Text style={styles.revCardLabel}>MONTHLY REVENUE</Text>
              <Text style={[styles.revCardVal, { color: '#7E22CE' }]}>₹{summary?.monthlyRevenue || 0}</Text>
              <Text style={styles.revCardSub}>Past 30 days revenue</Text>
            </View>

            <View style={[styles.revCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={styles.revCardLabel}>TOTAL COMMISSION</Text>
              <Text style={[styles.revCardVal, { color: '#047857' }]}>₹{summary?.totalCommission || 0}</Text>
              <Text style={styles.revCardSub}>Net collected fees</Text>
            </View>
          </View>

          {/* Commission Breakdown Strip */}
          <View style={styles.commissionStrip}>
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>PAID OUT</Text>
              <Text style={[styles.stripVal, { color: '#10B981' }]}>₹{summary?.paidCommission || 0}</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>PENDING PAYOUT</Text>
              <Text style={[styles.stripVal, { color: '#F59E0B' }]}>₹{summary?.pendingCommission || 0}</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>REFUNDS / CLAIMS</Text>
              <Text style={[styles.stripVal, { color: '#EF4444' }]}>₹{summary?.refunds || 0}</Text>
            </View>
          </View>

          {/* Revenue & Commission Graph */}
          <View style={styles.sectionBox}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Weekly Revenue & Commission Graph</Text>
                <Text style={styles.sectionSubtitle}>Comparative 4-week cashflow velocity</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Gross Vol</Text>
                <View style={[styles.legendDot, { backgroundColor: '#10B981', marginLeft: 8 }]} />
                <Text style={styles.legendText}>10% Comm</Text>
              </View>
            </View>

            {/* Visual Bar Graph */}
            <View style={styles.chartWrapper}>
              {graphData.map((item, index) => {
                const barHeight = Math.max(16, (item.revenue / maxBarValue) * 110);
                const commHeight = Math.max(6, (item.commission / maxBarValue) * 110);

                return (
                  <View key={index} style={styles.chartColumn}>
                    <Text style={styles.chartColAmount}>₹{item.revenue}</Text>
                    <View style={styles.barsContainer}>
                      <View style={[styles.bar, { height: barHeight, backgroundColor: '#3B82F6' }]} />
                      <View style={[styles.bar, { height: commHeight, backgroundColor: '#10B981', marginLeft: 4 }]} />
                    </View>
                    <Text style={styles.chartColLabel}>{item.period}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Payment & Invoice Records */}
          <View style={[styles.sectionBox, { marginTop: 14 }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Invoice & Settlement Records</Text>
                <Text style={styles.sectionSubtitle}>{invoices.length} verified transactions</Text>
              </View>
              <TouchableOpacity style={styles.miniExportBtn} onPress={handleExportCSV}>
                <Ionicons name="share-outline" size={14} color="#2563EB" />
                <Text style={styles.miniExportBtnText}>Share CSV</Text>
              </TouchableOpacity>
            </View>

            {invoices.length === 0 ? (
              <View style={styles.emptyInvoices}>
                <Ionicons name="receipt-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyInvoicesText}>No invoice records yet</Text>
              </View>
            ) : (
              invoices.map((inv) => (
                <View key={inv.id} style={styles.invoiceRow}>
                  <View style={styles.invIcon}>
                    <Ionicons name="document-text" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.invNumber}>{inv.invoiceNumber}</Text>
                      <Text style={styles.invAmount}>₹{inv.totalAmount}</Text>
                    </View>
                    <Text style={styles.invParties}>
                      {inv.customerName} ➔ {inv.workerName} ({inv.category})
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                      <Text style={styles.invDate}>{new Date(inv.date).toLocaleDateString()}</Text>
                      <Text style={styles.invCommission}>Fee: ₹{inv.platformCommission} (10%)</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Navigation Drawer */}
      <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  exportHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#64748B',
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  revCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  revCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  revCardVal: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  revCardSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  commissionStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
  },
  stripDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  stripLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  stripVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  chartColumn: {
    alignItems: 'center',
    width: 60,
  },
  chartColAmount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    width: 14,
    borderRadius: 4,
  },
  chartColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  miniExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  miniExportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 3,
  },
  emptyInvoices: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyInvoicesText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  invIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  invAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  invParties: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  invDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  invCommission: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
});
