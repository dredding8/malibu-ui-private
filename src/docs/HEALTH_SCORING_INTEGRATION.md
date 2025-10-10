# Opportunity Health Scoring Integration Guide

## Overview

The Opportunity Health Scoring system provides a comprehensive multi-factor analysis of Collection Opportunities, enabling operators to quickly identify and address issues before they impact operations.

## Architecture

### Health Scoring Engine (`utils/opportunityHealth.ts`)

The health scoring engine calculates a weighted composite score (0-100) based on six key metrics:

1. **Capacity Score (25%)** - Available capacity percentage
2. **Match Quality (20%)** - Satellite-to-mission alignment
3. **Conflict Count (20%)** - Scheduling conflicts (inverse scoring)
4. **Priority Alignment (15%)** - Mission priority vs resource allocation
5. **Utilization Efficiency (10%)** - Resource optimization (60-85% optimal)
6. **Risk Score (10%)** - Operational risk factors (inverse scoring)

### Health Levels

- **Optimal** (70-100): Green status, healthy operations
- **Warning** (30-69): Yellow status, attention needed
- **Critical** (0-29): Red status, immediate action required

## Component Integration

### 1. OpportunityStatusIndicatorEnhanced

Enhanced visual health indicator with:
- Compact mode for table cells
- Full mode with inline metrics
- Hover details with recommendations
- Quick action buttons

```tsx
<OpportunityStatusIndicatorEnhanced 
  health={healthData}
  compact={true}
  showDetails={false}
  onQuickAction={handleAction}
/>
```

### 2. CollectionOpportunitiesTable

Integrated health column showing:
- Real-time health scores
- Visual health indicators
- Sortable by health score
- Memoized calculations for performance

### 3. Performance Optimizations

- `useMemoizedHealthScores` hook prevents recalculation
- Debounced search (300ms) for responsive filtering
- Virtual scrolling ready for large datasets

## Business Logic

### Geographic Diversity
Calculates site distribution to ensure redundancy and coverage.

### Risk Assessment
- Capacity risk: Critical <10%, Warning <30%
- Conflict risk: 10 points per conflict (max 30)
- Single point of failure: 30 points for single site

### Recommendations Engine
Generates actionable recommendations based on:
- Health level (critical/warning/optimal)
- Specific metric failures
- Resource optimization opportunities

## Implementation Phases

### Phase 1 ✅ - Basic Integration
- Health indicator in tables
- Visual health status
- Basic sorting/filtering

### Phase 2 🚧 - Performance Optimization
- WebWorker for calculations
- Redis caching layer
- Real-time updates via WebSocket

### Phase 3 📋 - Analytics Dashboard
- Health trends over time
- Predictive modeling
- Automated alerts

### Phase 4 📋 - Advanced Features
- ML-based predictions
- Automated remediation
- Custom health profiles

## Usage Examples

### Calculate Health Score
```typescript
import { calculateOpportunityHealth } from '@/utils/opportunityHealth';

const health = calculateOpportunityHealth(opportunity, {
  critical: 10,
  warning: 30,
  optimal: 70
});
```

### Batch Health Calculation
```typescript
const healthMap = calculateBatchHealth(opportunities, thresholds);
```

### Health Trend Analysis
```typescript
const trend = getHealthTrend(currentHealth, previousHealth);
// Returns: 'improving' | 'declining' | 'stable'
```

## Future Enhancements

1. **Real-time Health Monitoring**
   - WebSocket integration for live updates
   - Push notifications for critical changes

2. **Machine Learning Integration**
   - Predictive health modeling
   - Anomaly detection
   - Optimization suggestions

3. **Custom Health Profiles**
   - Mission-specific scoring weights
   - User-defined thresholds
   - Role-based health views

4. **Automation Capabilities**
   - Auto-remediation workflows
   - Intelligent reallocation
   - Preventive maintenance

## Performance Considerations

- Health calculations: O(n) complexity
- Memory usage: ~50KB per 1000 opportunities
- Update frequency: Configurable (default 5s)
- Cache TTL: 60 seconds

## Security & Compliance

- No PII in health calculations
- Audit trail for health changes
- Role-based access to health data
- Compliant with data retention policies