import { forwardRef } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/Card';
import type { RenderedCard } from '@/content/types';

/** Portrait, the shape every social app expects. */
export const SHARE_WIDTH = 360;
export const SHARE_HEIGHT = 640;

interface Props {
  card: RenderedCard;
}

/**
 * The capture target. Mounted off-screen at a fixed size so `captureRef` has a
 * laid-out view to photograph; `left: -9999` rather than `display: none`,
 * because a view that is not laid out cannot be captured.
 */
export const ShareCard = forwardRef<View, Props>(function ShareCard({ card }, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        width: SHARE_WIDTH,
        height: SHARE_HEIGHT,
      }}>
      <Card card={card} variant="share" />
    </View>
  );
});
