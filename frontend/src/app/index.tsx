import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { useModule, Insight } from './ModuleContext';

export default function HomeScreen() {
  const {
    activeModule,
    aggregateData,
    imageUri,
    analysisResult,
    soilResult,
    insights,
  } = useModule();

  const color = (status: string) => {
    if (['Healthy', 'Good', 'Pristine', 'Optimal'].includes(status)) return '#00E5FF';
    if (['Moderate', 'Fair', 'Marginal'].includes(status)) return '#FF9800';
    return '#F44336';
  };

  const insightColor = (level: string) => {
    if (level === 'critical') return '#F44336';
    if (level === 'warning') return '#FF9800';
    return '#00E5FF';
  };

  // ─── CORE:COMMAND — Full-screen 3D Earth ──────────────────────────────────
  const renderCoreCommand = () => (
    <View style={styles.earthWrapper}>
      {Platform.OS === 'web' ? (
        // @ts-ignore
        <iframe
          src="/earth.html"
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#02050A' }}
          title="3D Earth"
        />
      ) : (
        <View style={styles.earthFallback}>
          <Text style={styles.earthFallbackText}>[ 3D EARTH — WEB ONLY ]</Text>
        </View>
      )}
    </View>
  );

  // ─── PLANTTALK ────────────────────────────────────────────────────────────
  const renderPlantTalk = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.moduleTitle}>🌱 PLANTTALK MODULE</Text>
      <Text style={styles.moduleSubtitle}>Plant Health Index — AI Diagnostics</Text>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
      {!imageUri && <View style={styles.emptyState}><Text style={styles.emptyText}>← Upload a plant image from the sidebar</Text></View>}

      {analysisResult && (
        <View style={[styles.resultCard, { borderColor: color(analysisResult.status) }]}>
          <Text style={styles.resultTitle}>PLANT HEALTH INDEX</Text>
          <Text style={[styles.resultBig, { color: color(analysisResult.status) }]}>{analysisResult.phi_score} / 100</Text>
          <Text style={[styles.resultStatus, { color: color(analysisResult.status) }]}>{analysisResult.status.toUpperCase()}</Text>
          <View style={styles.phiBar}><View style={[styles.phiFill, { width: `${analysisResult.phi_score}%` as any, backgroundColor: color(analysisResult.status) }]} /></View>
        </View>
      )}
      {renderInsights('PlantTalk')}
    </ScrollView>
  );

  // ─── AIRTRACE ─────────────────────────────────────────────────────────────
  const renderAirTrace = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.moduleTitle}>💨 AIRTRACE MODULE</Text>
      <Text style={styles.moduleSubtitle}>Real-time Air Quality Index — Open-Meteo</Text>

      {!aggregateData && <View style={styles.emptyState}><Text style={styles.emptyText}>← Use sidebar controls to load data</Text></View>}

      {aggregateData?.air && (
        <View style={[styles.resultCard, { borderColor: color(aggregateData.air.status) }]}>
          <Text style={styles.resultTitle}>AIR QUALITY INDEX</Text>
          <Text style={[styles.resultBig, { color: color(aggregateData.air.status) }]}>{aggregateData.air.aqi}</Text>
          <Text style={[styles.resultStatus, { color: color(aggregateData.air.status) }]}>{aggregateData.air.status.toUpperCase()}</Text>
          <View style={styles.phiBar}><View style={[styles.phiFill, { width: `${Math.min(aggregateData.air.aqi, 100)}%` as any, backgroundColor: color(aggregateData.air.status) }]} /></View>
          <Text style={styles.metaText}>Source: {aggregateData.air.provider}</Text>
          <View style={{ marginTop: 16 }}>
            <Text style={styles.scaleTitle}>AQI SCALE</Text>
            {[['0–50', 'Good', '#00E5FF'], ['51–100', 'Moderate', '#FF9800'], ['100+', 'Poor', '#F44336']].map(([range, label, c]) => (
              <View key={range} style={styles.scaleRow}>
                <View style={[styles.scaleColor, { backgroundColor: c as string }]} />
                <Text style={styles.scaleText}>{range} — {label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {renderInsights('AirTrace')}
    </ScrollView>
  );

  // ─── SOILSENSE ────────────────────────────────────────────────────────────
  const renderSoilSense = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.moduleTitle}>🪨 SOILSENSE MODULE</Text>
      <Text style={styles.moduleSubtitle}>Soil Health Analysis — Rule-Based Diagnostics</Text>

      {!soilResult && <View style={styles.emptyState}><Text style={styles.emptyText}>← Enter soil values in the sidebar and run scan</Text></View>}

      {soilResult && (
        <View style={[styles.resultCard, { borderColor: color(soilResult.status) }]}>
          <Text style={styles.resultTitle}>SOIL HEALTH SCORE</Text>
          <Text style={[styles.resultBig, { color: color(soilResult.status) }]}>{soilResult.soil_score} / 100</Text>
          <Text style={[styles.resultStatus, { color: color(soilResult.status) }]}>{soilResult.status.toUpperCase()}</Text>
          <View style={styles.phiBar}><View style={[styles.phiFill, { width: `${soilResult.soil_score}%` as any, backgroundColor: color(soilResult.status) }]} /></View>
          <Text style={styles.metaText}>💡 {soilResult.recommendation}</Text>
        </View>
      )}
      {renderInsights('SoilSense')}
    </ScrollView>
  );

  // ─── RIVERPULSE ───────────────────────────────────────────────────────────
  const renderRiverPulse = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.moduleTitle}>💧 RIVERPULSE MODULE</Text>
      <Text style={styles.moduleSubtitle}>Water Quality Telemetry — Hydro Sensor Network</Text>

      {!aggregateData && <View style={styles.emptyState}><Text style={styles.emptyText}>← Use sidebar controls to load data</Text></View>}

      {aggregateData?.water && (
        <View style={[styles.resultCard, { borderColor: color(aggregateData.water.status) }]}>
          <Text style={styles.resultTitle}>WATER HEALTH SCORE</Text>
          <Text style={[styles.resultBig, { color: color(aggregateData.water.status) }]}>{aggregateData.water.score} / 100</Text>
          <Text style={[styles.resultStatus, { color: color(aggregateData.water.status) }]}>{aggregateData.water.status.toUpperCase()}</Text>
          <View style={styles.phiBar}><View style={[styles.phiFill, { width: `${aggregateData.water.score}%` as any, backgroundColor: color(aggregateData.water.status) }]} /></View>
          <View style={styles.metricsGrid}>
            {[
              { label: 'pH Level', value: aggregateData.water.metrics.ph },
              { label: 'Dissolved O₂', value: `${aggregateData.water.metrics.do_mgl} mg/L` },
              { label: 'Turbidity', value: `${aggregateData.water.metrics.turbidity_ntu} NTU` },
            ].map(m => (
              <View key={m.label} style={styles.metricBox}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricValue}>{m.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.metaText}>Source: {aggregateData.water.source}</Text>
        </View>
      )}
      {renderInsights('RiverPulse')}
    </ScrollView>
  );

  // ─── INSIGHT CARDS (Phase 8) ──────────────────────────────────────────────
  const renderInsights = (module: string) => {
    const filtered = insights.filter(i => i.module === module);
    if (!filtered.length) return null;
    return (
      <View style={styles.insightsSection}>
        <Text style={styles.insightsTitle}>AI INSIGHTS</Text>
        {filtered.map(insight => (
          <View key={insight.id} style={[styles.insightCard, { borderLeftColor: insightColor(insight.level) }]}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightLevel, { color: insightColor(insight.level) }]}>
                {insight.level === 'critical' ? '🔴' : insight.level === 'warning' ? '🟡' : '🔵'} {insight.level.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightMessage}>{insight.message}</Text>
          </View>
        ))}
      </View>
    );
  };

  const isCore = activeModule === 'CORE:COMMAND';

  const renderModule = () => {
    switch (activeModule) {
      case 'PlantTalk':  return renderPlantTalk();
      case 'AirTrace':   return renderAirTrace();
      case 'SoilSense':  return renderSoilSense();
      case 'RiverPulse': return renderRiverPulse();
      default:           return renderCoreCommand();
    }
  };

  // Badge for notification count
  const criticalCount = insights.filter(i => i.level === 'critical').length;

  return (
    <View style={styles.container}>
      {!isCore && (
        <View style={styles.topHud}>
          <View style={styles.hubWidget}>
            <Text style={styles.hubText}>🛰 ORBITAL HUB: V4.TACTICAL — {activeModule}</Text>
          </View>
          <View style={styles.hudRight}>
            {criticalCount > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>🔴 {criticalCount} ALERT{criticalCount > 1 ? 'S' : ''}</Text>
              </View>
            )}
            {insights.length > 0 && criticalCount === 0 && (
              <View style={[styles.alertBadge, { borderColor: '#FF9800' }]}>
                <Text style={[styles.alertBadgeText, { color: '#FF9800' }]}>🟡 {insights.length} INSIGHT{insights.length > 1 ? 'S' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      )}
      {renderModule()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02050A' },
  earthWrapper: { flex: 1, width: '100%', height: '100%' },
  earthFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  earthFallbackText: { color: '#00E5FF', opacity: 0.4 },

  topHud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A233A' },
  hubWidget: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.05)' },
  hubText: { color: '#00E5FF', fontWeight: 'bold', letterSpacing: 0.8, fontSize: 12 },
  hudRight: { flexDirection: 'row', gap: 10 },
  alertBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.08)' },
  alertBadgeText: { color: '#F44336', fontSize: 11, fontWeight: 'bold' },

  content: { padding: 28, paddingBottom: 60 },
  moduleTitle: { color: '#00E5FF', fontSize: 22, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  moduleSubtitle: { color: '#8A99B5', fontSize: 13, marginBottom: 28 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyText: { color: '#4A5B7A', fontSize: 14, fontStyle: 'italic' },

  previewImage: { width: '100%', maxWidth: 500, height: 260, borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', marginBottom: 20 },

  resultCard: { backgroundColor: 'rgba(10,15,30,0.9)', padding: 24, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  resultTitle: { color: '#4A5B7A', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  resultBig: { fontSize: 52, fontWeight: '200', letterSpacing: 2 },
  resultStatus: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  phiBar: { height: 6, backgroundColor: '#1A233A', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  phiFill: { height: '100%', borderRadius: 3 },
  metaText: { color: '#4A5B7A', fontSize: 11, marginTop: 4 },

  scaleTitle: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  scaleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  scaleColor: { width: 10, height: 10, borderRadius: 2, marginRight: 10 },
  scaleText: { color: '#8A99B5', fontSize: 12 },

  metricsGrid: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 12 },
  metricBox: { flex: 1, backgroundColor: '#02050A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1A233A', alignItems: 'center' },
  metricLabel: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', marginBottom: 6 },
  metricValue: { color: '#00E5FF', fontSize: 16, fontWeight: '300' },

  // Phase 8 — Insight cards
  insightsSection: { marginTop: 8 },
  insightsTitle: { color: '#4A5B7A', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  insightCard: { backgroundColor: 'rgba(10,15,30,0.9)', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#1A233A', borderLeftWidth: 3, marginBottom: 10 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  insightLevel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  insightTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  insightMessage: { color: '#8A99B5', fontSize: 12, lineHeight: 18 },
});
