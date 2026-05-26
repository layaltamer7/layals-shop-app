export const translations = {
  en: {
    appTitle: "Layal's shop",
    offlineMode: 'Offline mode',
    syncPaused: 'Sync paused to save battery',
    recentCache: 'Showing recently viewed fashion picks',
    emptyWishlist: 'Your wishlist is empty.',
    emptyOrders: 'No orders yet. Your completed checkouts will appear here.',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    addToCart: 'Add To Cart',
    checkout: 'Checkout',
    wishlist: 'Wishlist',
    cart: 'Cart',
    stores: 'Stores',
    orders: 'Orders',
    account: 'Account',
    scanner: 'Scanner'
  },
  ar: {
    appTitle: 'متجر ليال',
    offlineMode: 'وضع عدم الاتصال',
    syncPaused: 'تم إيقاف المزامنة لتوفير البطارية',
    recentCache: 'يتم عرض القطع التي تمت مشاهدتها مؤخرًا',
    emptyWishlist: 'قائمة المفضلة فارغة.',
    emptyOrders: 'لا توجد طلبات بعد. ستظهر طلباتك المكتملة هنا.',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    addToCart: 'أضف إلى السلة',
    checkout: 'إتمام الشراء',
    wishlist: 'المفضلة',
    cart: 'السلة',
    stores: 'الفروع',
    orders: 'الطلبات',
    account: 'الحساب',
    scanner: 'الماسح'
  }
} as const;

export type TranslationKey = keyof (typeof translations)['en'];
