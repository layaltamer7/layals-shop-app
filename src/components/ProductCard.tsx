import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useSettings } from '../providers/SettingsProvider';
import type { Product } from '../types';

type ProductCardProps = {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
  inWishlist: boolean;
};

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  inWishlist,
}: ProductCardProps) {
  const { palette, formatCurrency } = useSettings();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
        <LinearGradient colors={['transparent', 'rgba(23, 8, 30, 0.62)']} style={styles.imageOverlay} />
        <View style={styles.imageTopRow}>
          <View style={[styles.badge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.badgeText, { color: palette.accent }]}>{product.category}</Text>
          </View>
          <Pressable onPress={onToggleWishlist} hitSlop={8} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.86)' }]}>
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={20}
              color={inWishlist ? palette.danger : palette.text}
            />
          </Pressable>
        </View>
        <View style={styles.imageBottomRow}>
          <Text style={styles.imageTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={styles.imagePrice}>{formatCurrency(product.price, product.currencyCode)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: palette.mutedText }]} numberOfLines={2}>
          {product.description}
        </Text>

        <View style={styles.bottomRow}>
          <View style={[styles.stockPill, { backgroundColor: product.stock > 0 ? palette.chip : palette.banner }]}>
            <Text style={[styles.stock, { color: product.stock > 0 ? palette.success : palette.danger }]}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>

          <Pressable onPress={onAddToCart} disabled={product.stock <= 0} style={{ opacity: product.stock > 0 ? 1 : 0.5 }}>
            <LinearGradient colors={[palette.primary, palette.accent]} style={styles.cta}>
              <Text style={styles.ctaText}>Add</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 5,
  },
  imageWrap: {
    position: 'relative',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  imageTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBottomRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
  },
  imageTitle: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  imagePrice: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stockPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stock: {
    fontSize: 12,
    fontWeight: '800',
  },
  cta: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '900',
  },
});
