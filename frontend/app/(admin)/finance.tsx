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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import api from '../../services/api';
import AdminDrawer from '../../components/AdminDrawer';

const { width } = Dimensions.get('window');

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

interface GraphItem {
  period: string;
  date?: string;
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
  const [dailyGraph, setDailyGraph] = useState<GraphItem[]>([]);
  const [weeklyGraph, setWeeklyGraph] = useState<GraphItem[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState<'7days' | '4weeks'>('7days');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/finance');
      if (res.data?.success) {
        setSummary(res.data.data.summary);
        setDailyGraph(res.data.data.dailyGraph || res.data.data.revenueGraph || []);
        setWeeklyGraph(res.data.data.weeklyGraph || []);
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
        navigator.clipboard?.writeText(csvContent);
        Alert.alert('Export Successful', `Exported ${invoices.length} transaction records! CSV copied to clipboard.`);
      } else {
        await Share.share({
          title: 'RapidFix Financial Report',
          message: csvContent,
        });
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message || 'Unable to share report');
    }
  };

  const currentGraphData = activeTimeframe === '7days' ? dailyGraph : weeklyGraph;
  const maxBarValue = Math.max(...currentGraphData.map(g => g.revenue), 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => setDrawerVisible(true)}>
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Financial Center</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Live Revenue, Commission & Invoices</Text>
        </View>
        <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExportCSV}>
          <Ionicons name="download-outline" size={16} color="#2563EB" />
          <Text style={styles.exportHeaderBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Compiling live financial statements...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Revenue Summary Cards */}
          <View style={styles.revenueGrid}>
            <View style={[styles.revCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
              <Text style={styles.revCardLabel}>TODAY'S REVENUE</Text>
              <Text style={[styles.revCardVal, { color: '#1D4ED8' }]} numberOfLines={1} adjustsFontSizeToFit>
                ₹{summary?.todayRevenue || 0}
              </Text>
              <Text style={styles.revCardSub} numberOfLines={1}>10% Platform fee</Text>
            </View>

            <View style={[styles.revCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
              <Text style={styles.revCardLabel}>WEEKLY REVENUE</Text>
              <Text style={[styles.revCardVal, { color: '#15803D' }]} numberOfLines={1} adjustsFontSizeToFit>
                ₹{summary?.weeklyRevenue || 0}
              </Text>
              <Text style={styles.revCardSub} numberOfLines={1}>Last 7 days volume</Text>
            </View>
          </View>

          <View style={[styles.revenueGrid, { marginTop: 10 }]}>
            <View style={[styles.revCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}>
              <Text style={styles.revCardLabel}>MONTHLY REVENUE</Text>
              <Text style={[styles.revCardVal, { color: '#7E22CE' }]} numberOfLines={1} adjustsFontSizeToFit>
                ₹{summary?.monthlyRevenue || 0}
              </Text>
              <Text style={styles.revCardSub} numberOfLines={1}>Past 30 days total</Text>
            </View>

            <View style={[styles.revCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={styles.revCardLabel}>TOTAL COMMISSION</Text>
              <Text style={[styles.revCardVal, { color: '#047857' }]} numberOfLines={1} adjustsFontSizeToFit>
                ₹{summary?.totalCommission || 0}
              </Text>
              <Text style={styles.revCardSub} numberOfLines={1}>Collected to date</Text>
            </View>
          </View>

          {/* Commission Breakdown Strip */}
          <View style={styles.commissionStrip}>
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>PAID OUT</Text>
              <Text style={[styles.stripVal, { color: '#10B981' }]} numberOfLines={1}>₹{summary?.paidCommission || 0}</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>PENDING</Text>
              <Text style={[styles.stripVal, { color: '#F59E0B' }]} numberOfLines={1}>₹{summary?.pendingCommission || 0}</Text>
            </View>
            <View style={styles.stripDivider} />
            <View style={styles.stripItem}>
              <Text style={styles.stripLabel}>REFUNDS</Text>
              <Text style={[styles.stripVal, { color: '#EF4444' }]} numberOfLines={1}>₹{summary?.refunds || 0}</Text>
            </View>
          </View>

          {/* 📊 LIVE Revenue & Commission Graph */}
          <View style={styles.sectionBox}>
            {/* Graph Header: Title and Timeframe Toggle */}
            <View style={styles.graphTopRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sectionTitle}>Live Revenue & Commission</Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                  {activeTimeframe === '7days' ? 'Daily breakdown of the last 7 days' : 'Weekly breakdown of the last 4 weeks'}
                </Text>
              </View>

              {/* Timeframe Switcher Tabs */}
              <View style={styles.timeframeToggle}>
                <TouchableOpacity 
                  style={[styles.timeframeBtn, activeTimeframe === '7days' && styles.timeframeBtnActive]}
                  onPress={() => setActiveTimeframe('7days')}
                >
                  <Text style={[styles.timeframeText, activeTimeframe === '7days' && styles.timeframeTextActive]}>
                    7 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.timeframeBtn, activeTimeframe === '4weeks' && styles.timeframeBtnActive]}
                  onPress={() => setActiveTimeframe('4weeks')}
                >
                  <Text style={[styles.timeframeText, activeTimeframe === '4weeks' && styles.timeframeTextActive]}>
                    4 Weeks
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Legend Bar */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Gross Volume (₹)</Text>
              </View>
              <View style={[styles.legendItem, { marginLeft: 16 }]}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>10% Commission (₹)</Text>
              </View>
            </View>

            {/* Responsive Visual Bar Graph */}
            <View style={styles.chartWrapper}>
              {currentGraphData.map((item, index) => {
                const barHeight = Math.max(8, (item.revenue / maxBarValue) * 105);
                const commHeight = Math.max(4, (item.commission / maxBarValue) * 105);

                return (
                  <View key={index} style={styles.chartColumn}>
                    {/* Amount Label on Top */}
                    <Text style={styles.chartColAmount} numberOfLines={1}>
                      {item.revenue > 0 ? `₹${item.revenue}` : '0'}
                    </Text>

                    {/* Dual Bars Container */}
                    <View style={styles.barsContainer}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: barHeight, 
                            backgroundColor: item.revenue > 0 ? '#3B82F6' : '#E2E8F0',
                            width: activeTimeframe === '7days' ? 10 : 16,
                          }
                        ]} 
                      />
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: commHeight, 
                            backgroundColor: item.commission > 0 ? '#10B981' : '#E2E8F0', 
                            marginLeft: 3,
                            width: activeTimeframe === '7days' ? 8 : 12,
                          }
                        ]} 
                      />
                    </View>

                    {/* Date/Day Label at the Bottom */}
                    <Text style={styles.chartColLabel} numberOfLines={1}>{item.period}</Text>
                    {item.date ? (
                      <Text style={styles.chartColDate}>{item.date}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Payment & Invoice Records */}
          <View style={[styles.sectionBox, { marginTop: 14 }]}>
            <View style={styles.invoiceHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Invoice Records</Text>
                <Text style={styles.sectionSubtitle}>{invoices.length} completed transactions</Text>
              </View>
              <TouchableOpacity style={styles.miniExportBtn} onPress={handleExportCSV}>
                <Ionicons name="share-outline" size={13} color="#2563EB" />
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
                    <Ionicons name="document-text" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.invTopLine}>
                      <Text style={styles.invNumber}>{inv.invoiceNumber}</Text>
                      <Text style={styles.invAmount}>₹{inv.totalAmount}</Text>
                    </View>
                    <Text style={styles.invParties} numberOfLines={1} ellipsizeMode="tail">
                      {inv.customerName} ➔ {inv.workerName} ({inv.category})
                    </Text>
                    <View style={styles.invBottomLine}>
                      <Text style={styles.invDate}>{new Date(inv.date).toLocaleDateString()}</Text>
                      <Text style={styles.invCommission}>Platform Fee: ₹{inv.platformCommission}</Text>
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
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    padding: 14,
    paddingBottom: 28,
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
    gap: 8,
  },
  revCard: {
    flex: 1,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  revCardLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  revCardVal: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 3,
  },
  revCardSub: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  commissionStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
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
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  stripLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  stripVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  graphTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginLeft: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#047857',
  },
  timeframeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  timeframeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeframeBtnActive: {
    backgroundColor: '#2563EB',
  },
  timeframeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 145,
    paddingTop: 16,
    paddingBottom: 4,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartColAmount: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    borderRadius: 3,
  },
  chartColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  chartColDate: {
    fontSize: 8,
    color: '#94A3B8',
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
    marginLeft: 3,
  },
  emptyInvoices: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyInvoicesText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  invIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  invAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  invParties: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 1,
  },
  invBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  invDate: {
    fontSize: 9.5,
    color: '#94A3B8',
  },
  invCommission: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#2563EB',
  },
});
