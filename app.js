(() => {
  const cfg = window.APP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR_PROJECT') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('YOUR_');
  const sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  window.GP = { sb, products: {} };
  const $ = (s) => document.querySelector(s);
  const money = (n) => Number(n || 0).toFixed(2);

  async function loadPublicContent() {
    if (!sb) return;
    const [{ data: settings }, { data: products }] = await Promise.all([
      sb.from('site_settings').select('*').eq('id', true).maybeSingle(),
      sb.from('products').select('*').eq('active', true).order('sort_order')
    ]);
    if (settings) {
      const h1 = $('h1'); if (h1) h1.innerHTML = `${escapeHtml(settings.hero_title).replace('3D 营销礼品定制工作室','<span class="gradient-text">3D 营销礼品定制工作室</span>')}`;
      const p = $('#studio .text-center p'); if (p && settings.hero_subtitle) p.textContent = settings.hero_subtitle;
      document.title = `${settings.brand_name} | 3D 营销礼品定制平台`;
      document.querySelectorAll('header .mono-font').forEach(el => { if (el.textContent.includes('GIFTS-POWERS')) el.childNodes[0].textContent = settings.brand_name.split(' ')[0] + ' '; });
    }
    (products || []).forEach(p => { window.GP.products[p.id] = p; });
    const map = { bottle:0, mug:1, coin:2 };
    Object.entries(window.GP.products).forEach(([id,p]) => {
      const i = map[id]; if (i === undefined) return;
      const tab = document.querySelector(`[data-model="${id}"]`); if (tab) tab.textContent = p.title.replace('高级双层','').replace('高透质感','').replace('定制金属','');
    });
    // Model title/spec/base price are read by the original 3D engine.
    const title = $('#model-title'), spec = $('#spec-text');
    const active = window.GP.products.bottle;
    if (active) { if(title) title.textContent=active.title; if(spec) spec.textContent=active.spec; }
    const original = window.MODEL_CONFIGS;
    if (original) Object.entries(window.GP.products).forEach(([id,p]) => { if(original[id]) { original[id].title=p.title; original[id].spec=p.spec; original[id].basePrice=Number(p.base_price); } });
    if (typeof window.calculatePrice === 'function') window.calculatePrice();
  }
  function escapeHtml(s='') { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Add names to original form controls, without changing its visual design.
  document.addEventListener('DOMContentLoaded', () => {
    const form = $('#inquiry-modal form');
    if (form) {
      const fields = [...form.querySelectorAll('input,textarea')];
      ['customer_name','phone','company','message'].forEach((n,i)=>{ if(fields[i]) fields[i].name=n; });
    }
  });

  window.handleFormSubmit = async function(e) {
    e.preventDefault();
    if (!sb) { alert('网站尚未连接 Supabase。请先在 public/config.js 配置项目 URL 和 anon key。'); return; }
    const form = e.target, fd = new FormData(form);
    const qty = Number($('#qty-slider')?.value || 500);
    const unit = Number(String($('#unit-price')?.textContent || '').replace(/[^0-9.]/g,'')) || null;
    const total = unit ? Number((unit * qty).toFixed(2)) : null;
    const product = window.GP.products[window.activeModelType || 'bottle'];
    const payload = {
      customer_name: String(fd.get('customer_name')||'').trim(), phone: String(fd.get('phone')||'').trim(),
      company: String(fd.get('company')||'').trim(), message: String(fd.get('message')||'').trim(),
      product_id: window.activeModelType || 'bottle', product_title: product?.title || $('#model-title')?.textContent || '',
      quantity: qty, craft: $('#craft-select')?.selectedOptions[0]?.textContent || '',
      estimated_unit_price: unit, estimated_total: total
    };
    const { error } = await sb.from('inquiries').insert(payload);
    if (error) { alert(`提交失败：${error.message}`); return; }
    alert('询价已成功提交！我们的定制顾问将尽快与您联系。');
    form.reset(); window.toggleModal(false);
  };
  loadPublicContent().catch(console.error);
})();
