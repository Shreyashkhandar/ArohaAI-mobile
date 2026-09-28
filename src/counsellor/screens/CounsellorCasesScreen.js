import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getCounsellorCases } from '../services/caseService';

export default function CounsellorCasesScreen({ onSelectCase, onAddNewVictim }) {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'needs_review', 'name'
  const [errorMessage, setErrorMessage] = useState('');

  const loadCases = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage('');

    try {
      const res = await getCounsellorCases();
      if (Array.isArray(res)) {
        setCases(res);
      } else if (res && res.success && Array.isArray(res.cases)) {
        setCases(res.cases);
      } else if (res && !res.success) {
        if (res.errorType === 'AUTH_REQUIRED') {
          setErrorMessage('Your session has expired. Please sign in again.');
        } else {
          setErrorMessage('Unable to load assigned cases. Please try again.');
        }
        setCases([]);
      } else {
        setCases([]);
      }
    } catch (err) {
      setErrorMessage('An error occurred while loading cases.');
      setCases([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filteredCases = (Array.isArray(cases) ? cases : []).filter((c) => {
    if (!c) return false;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.userName?.toLowerCase().includes(q) ||
      c.userEmail?.toLowerCase().includes(q) ||
      c.userPhone?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'requires_review'
        ? Boolean(c.requiresReview)
        : String(c.status || '').toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'needs_review') {
      return (b?.requiresReview ? 1 : 0) - (a?.requiresReview ? 1 : 0);
    }
    if (sortBy === 'name') {
      return (a?.userName || '').localeCompare(b?.userName || '');
    }
    // Default: recent
    return new Date(b?.created_at || 0) - new Date(a?.created_at || 0);
  });

  const reviewCount = cases.filter((c) => Boolean(c.requiresReview)).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search & Sort Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchWrapper}>
          <Icon name="search" size={16} color={COLORS.textSubtle} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search victim name, phone, email, or case ID..."
            placeholderTextColor="#8A9D93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Icon name="close" size={16} color={COLORS.textSubtle} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {[
            { id: 'all', label: `All (${cases.length})` },
            { id: 'active', label: 'Active' },
            { id: 'requires_review', label: `Requires Review (${reviewCount})` },
            { id: 'follow_up', label: 'Follow-up' },
            { id: 'closed', label: 'Closed' },
          ].map((f) => {
            const isSelected = statusFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setStatusFilter(f.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error State Banner */}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Icon name="warning" size={16} color="#9B1C1C" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadCases()} activeOpacity={0.7}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Case List Body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadCases(true)} tintColor={COLORS.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Loading assigned cases...</Text>
          </View>
        ) : filteredCases.length > 0 ? (
          <View style={styles.caseList}>
            {filteredCases.map((c) => {
              const displayName = c.userName || c.user_profile?.full_name || 'Unnamed User';
              const displayStatus = String(c.status || 'Not assigned').toUpperCase();
              const displayPhone = c.userPhone || c.user_profile?.phone || 'Not provided';
              const displayEmail = c.userEmail || c.user_profile?.email || 'N/A';
              const lastCheckInStr = c.lastCheckIn ? new Date(c.lastCheckIn).toLocaleDateString() : 'No check-in recorded';

              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.caseCard, c.requiresReview && styles.caseCardAlert]}
                  onPress={() => onSelectCase && onSelectCase(c)}
                  activeOpacity={0.8}
                >
                  <View style={styles.caseHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.victimName}>{displayName}</Text>
                      <Text style={styles.caseRefId}>Case ID: {c.id?.slice(0, 12) || 'N/A'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {c.requiresReview && (
                        <View style={styles.alertBadge}>
                          <Text style={styles.alertBadgeText}>REQUIRES REVIEW</Text>
                        </View>
                      )}
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{displayStatus}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.caseDetailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Phone:</Text>
                      <Text style={styles.detailValue}>{displayPhone}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>{displayEmail}</Text>
                    </View>
                  </View>

                  <View style={styles.caseFooter}>
                    <View style={styles.footerLeft}>
                      <Icon name="calendar" size={13} color={COLORS.textSubtle} style={{ marginRight: 4 }} />
                      <Text style={styles.lastActivityText}>
                        Last Check-in: {lastCheckInStr}
                      </Text>
                    </View>
                    <View style={styles.viewCaseLink}>
                      <Text style={styles.viewCaseText}>View Case</Text>
                      <Icon name="arrow-forward" size={13} color={COLORS.primary} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="document-text-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Cases Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== 'all'
                ? 'No assigned cases match your current filters.'
                : 'You currently have no victim cases assigned.'}
            </Text>

            {(onAddNewVictim || onAddNewVictim) && (
              <TouchableOpacity
                style={styles.registerButton}
                onPress={onAddNewVictim}
                activeOpacity={0.85}
              >
                <Icon name="person-add" size={16} color={COLORS.buttonText} style={{ marginRight: 6 }} />
                <Text style={styles.registerButtonText}>Register New Victim</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterSection: {
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    marginBottom: SPACING.xs + 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  filterChipsRow: {
    gap: SPACING.xs + 2,
    paddingVertical: 4,
  },
  filterChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  filterChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
  filterChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F8B4B4',
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B1C1C',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 125,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    marginTop: 10,
  },
  caseList: {
    gap: SPACING.md,
    width: '100%',
  },
  caseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    width: '100%',
  },
  caseCardAlert: {
    borderColor: '#F8B4B4',
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  victimName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  caseRefId: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  alertBadge: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F8B4B4',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9B1C1C',
  },
  statusBadge: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  caseDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F7F5',
    paddingTop: 10,
    marginTop: 6,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastActivityText: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  viewCaseLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCaseText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.selectedCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: COLORS.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
});
