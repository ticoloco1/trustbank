'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: {
    nav: { properties:'Properties', cars:'Cars', slugs:'Slugs', plans:'Plans', signIn:'Sign In', editor:'Editor', cart:'Cart' },
    editor: { save:'Save', saving:'Saving...', preview:'Preview', publish:'Publish', viewSite:'View Site' },
    cart: { title:'Cart', empty:'Cart is empty', total:'Total', pay:'Continue →', confirmed:'Payment confirmed!', close:'Close' },
    common: { loading:'Loading...', save:'Save', cancel:'Cancel', add:'Add', search:'Search' },
  }},
  pt: { translation: {
    nav: { properties:'Imóveis', cars:'Carros', slugs:'Slugs', plans:'Planos', signIn:'Entrar', editor:'Editor', cart:'Carrinho' },
    editor: { save:'Salvar', saving:'Salvando...', preview:'Preview', publish:'Publicar', viewSite:'Ver Site' },
    cart: { title:'Carrinho', empty:'Carrinho vazio', total:'Total', pay:'Continuar →', confirmed:'Pagamento confirmado!', close:'Fechar' },
    common: { loading:'Carregando...', save:'Salvar', cancel:'Cancelar', add:'Adicionar', search:'Buscar' },
  }},
  es: { translation: {
    nav: { properties:'Propiedades', cars:'Coches', slugs:'Slugs', plans:'Planes', signIn:'Iniciar Sesión', editor:'Editor', cart:'Carrito' },
    editor: { save:'Guardar', saving:'Guardando...', preview:'Vista Previa', publish:'Publicar', viewSite:'Ver Sitio' },
    cart: { title:'Carrito', empty:'Carrito vacío', total:'Total', pay:'Continuar →', confirmed:'¡Pago confirmado!', close:'Cerrar' },
    common: { loading:'Cargando...', save:'Guardar', cancel:'Cancelar', add:'Añadir', search:'Buscar' },
  }},
  de: { translation: {
    nav: { properties:'Immobilien', cars:'Autos', slugs:'Slugs', plans:'Pläne', signIn:'Anmelden', editor:'Editor', cart:'Warenkorb' },
    editor: { save:'Speichern', saving:'Speichern...', preview:'Vorschau', publish:'Veröffentlichen', viewSite:'Ansehen' },
    cart: { title:'Warenkorb', empty:'Leer', total:'Gesamt', pay:'Weiter →', confirmed:'Zahlung bestätigt!', close:'Schließen' },
    common: { loading:'Laden...', save:'Speichern', cancel:'Abbrechen', add:'Hinzufügen', search:'Suchen' },
  }},
  fr: { translation: {
    nav: { properties:'Immobilier', cars:'Voitures', slugs:'Slugs', plans:'Plans', signIn:'Connexion', editor:'Éditeur', cart:'Panier' },
    editor: { save:'Enregistrer', saving:'Enregistrement...', preview:'Aperçu', publish:'Publier', viewSite:'Voir le site' },
    cart: { title:'Panier', empty:'Panier vide', total:'Total', pay:'Continuer →', confirmed:'Paiement confirmé!', close:'Fermer' },
    common: { loading:'Chargement...', save:'Enregistrer', cancel:'Annuler', add:'Ajouter', search:'Rechercher' },
  }},
  it: { translation: {
    nav: { properties:'Proprietà', cars:'Auto', slugs:'Slugs', plans:'Piani', signIn:'Accedi', editor:'Editor', cart:'Carrello' },
    editor: { save:'Salva', saving:'Salvataggio...', preview:'Anteprima', publish:'Pubblica', viewSite:'Vedi Sito' },
    cart: { title:'Carrello', empty:'Vuoto', total:'Totale', pay:'Continua →', confirmed:'Pagamento confermato!', close:'Chiudi' },
    common: { loading:'Caricamento...', save:'Salva', cancel:'Annulla', add:'Aggiungi', search:'Cerca' },
  }},
  sv: { translation: {
    nav: { properties:'Fastigheter', cars:'Bilar', slugs:'Slugs', plans:'Planer', signIn:'Logga in', editor:'Redigerare', cart:'Varukorg' },
    editor: { save:'Spara', saving:'Sparar...', preview:'Förhandsvisning', publish:'Publicera', viewSite:'Visa sida' },
    cart: { title:'Varukorg', empty:'Tom varukorg', total:'Totalt', pay:'Fortsätt →', confirmed:'Betalning bekräftad!', close:'Stäng' },
    common: { loading:'Laddar...', save:'Spara', cancel:'Avbryt', add:'Lägg till', search:'Sök' },
  }},
  ru: { translation: {
    nav: { properties:'Недвижимость', cars:'Авто', slugs:'Слаги', plans:'Планы', signIn:'Войти', editor:'Редактор', cart:'Корзина' },
    editor: { save:'Сохранить', saving:'Сохранение...', preview:'Предпросмотр', publish:'Опубликовать', viewSite:'Смотреть' },
    cart: { title:'Корзина', empty:'Корзина пуста', total:'Итого', pay:'Продолжить →', confirmed:'Платёж подтверждён!', close:'Закрыть' },
    common: { loading:'Загрузка...', save:'Сохранить', cancel:'Отмена', add:'Добавить', search:'Поиск' },
  }},
  ar: { translation: {
    nav: { properties:'عقارات', cars:'سيارات', slugs:'سلاغز', plans:'خطط', signIn:'تسجيل الدخول', editor:'محرر', cart:'عربة' },
    editor: { save:'حفظ', saving:'جاري الحفظ...', preview:'معاينة', publish:'نشر', viewSite:'عرض الموقع' },
    cart: { title:'عربة التسوق', empty:'العربة فارغة', total:'المجموع', pay:'متابعة →', confirmed:'تم تأكيد الدفع!', close:'إغلاق' },
    common: { loading:'تحميل...', save:'حفظ', cancel:'إلغاء', add:'إضافة', search:'بحث' },
  }},
  hi: { translation: {
    nav: { properties:'संपत्ति', cars:'कारें', slugs:'स्लग्स', plans:'योजनाएं', signIn:'साइन इन', editor:'संपादक', cart:'कार्ट' },
    editor: { save:'सहेजें', saving:'सहेज रहे हैं...', preview:'पूर्वावलोकन', publish:'प्रकाशित करें', viewSite:'साइट देखें' },
    cart: { title:'कार्ट', empty:'कार्ट खाली है', total:'कुल', pay:'जारी रखें →', confirmed:'भुगतान की पुष्टि!', close:'बंद करें' },
    common: { loading:'लोड हो रहा है...', save:'सहेजें', cancel:'रद्द करें', add:'जोड़ें', search:'खोजें' },
  }},
  ko: { translation: {
    nav: { properties:'부동산', cars:'자동차', slugs:'슬러그', plans:'플랜', signIn:'로그인', editor:'편집기', cart:'장바구니' },
    editor: { save:'저장', saving:'저장 중...', preview:'미리보기', publish:'게시', viewSite:'사이트 보기' },
    cart: { title:'장바구니', empty:'장바구니가 비어 있습니다', total:'합계', pay:'계속 →', confirmed:'결제 확인!', close:'닫기' },
    common: { loading:'로딩 중...', save:'저장', cancel:'취소', add:'추가', search:'검색' },
  }},
  vi: { translation: {
    nav: { properties:'Bất động sản', cars:'Xe hơi', slugs:'Slug', plans:'Gói', signIn:'Đăng nhập', editor:'Trình soạn thảo', cart:'Giỏ hàng' },
    editor: { save:'Lưu', saving:'Đang lưu...', preview:'Xem trước', publish:'Xuất bản', viewSite:'Xem trang' },
    cart: { title:'Giỏ hàng', empty:'Giỏ hàng trống', total:'Tổng', pay:'Tiếp tục →', confirmed:'Thanh toán thành công!', close:'Đóng' },
    common: { loading:'Đang tải...', save:'Lưu', cancel:'Hủy', add:'Thêm', search:'Tìm kiếm' },
  }},
  ja: { translation: {
    nav: { properties:'不動産', cars:'車', slugs:'スラッグ', plans:'プラン', signIn:'ログイン', editor:'編集', cart:'カート' },
    editor: { save:'保存', saving:'保存中...', preview:'プレビュー', publish:'公開', viewSite:'表示' },
    cart: { title:'カート', empty:'空', total:'合計', pay:'続ける →', confirmed:'支払い確認！', close:'閉じる' },
    common: { loading:'読込中...', save:'保存', cancel:'キャンセル', add:'追加', search:'検索' },
  }},
  zh: { translation: {
    nav: { properties:'房产', cars:'汽车', slugs:'短链', plans:'套餐', signIn:'登录', editor:'编辑', cart:'购物车' },
    editor: { save:'保存', saving:'保存中...', preview:'预览', publish:'发布', viewSite:'查看' },
    cart: { title:'购物车', empty:'空', total:'总计', pay:'继续 →', confirmed:'付款确认！', close:'关闭' },
    common: { loading:'加载中...', save:'保存', cancel:'取消', add:'添加', search:'搜索' },
  }},
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    lng: typeof window !== 'undefined'
      ? (localStorage.getItem('i18n-lang') || navigator.language.slice(0,2) || 'en')
      : 'en',
  });
}

export { i18n };

export const LANGUAGES = [
  { code: 'pt', label: 'Português',   flag: '🇧🇷' },
  { code: 'en', label: 'English',     flag: '🇺🇸' },
  { code: 'es', label: 'Español',     flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',     flag: '🇩🇪' },
  { code: 'fr', label: 'Français',    flag: '🇫🇷' },
  { code: 'it', label: 'Italiano',    flag: '🇮🇹' },
  { code: 'sv', label: 'Svenska',     flag: '🇸🇪' },
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
  { code: 'ar', label: 'العربية',     flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'ko', label: '한국어',       flag: '🇰🇷' },
  { code: 'vi', label: 'Tiếng Việt',  flag: '🇻🇳' },
  { code: 'ja', label: '日本語',       flag: '🇯🇵' },
  { code: 'zh', label: '中文',         flag: '🇨🇳' },
];
