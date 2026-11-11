(() => {
    const cfg = window.APP_CONFIG || {};
    const configured = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.includes('YOUR_PROJECT') && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes('YOUR_');
    const sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
    window.GP = { sb, products: {} };
    const $ = (s) => document.querySelector(s);

    // 核心：从 Supabase 异步加载后台配置与商品
    async function loadPublicContent() {
        if (!sb) return;
        try {
            const [{ data: settings }, { data: products }] = await Promise.all([
                sb.from('site_settings').select('*').eq('id', true).maybeSingle(),
                sb.from('products').select('*').eq('active', true).order('sort_order')
            ]);

            // 1. 同步后台站点设置
            if (settings) {
                const h1 = $('h1'); 
                if (h1 && settings.hero_title) {
                    h1.innerHTML = escapeHtml(settings.hero_title).replace('3D 营销礼品定制工作室','<span class="gradient-text">3D 营销礼品定制工作室</span>');
                }
                const p = $('#studio .text-center p'); 
                if (p && settings.hero_subtitle) p.textContent = settings.hero_subtitle;
                if (settings.brand_name) {
                    document.title = `${settings.brand_name} | 3D 营销礼品定制平台`;
                    document.querySelectorAll('header .mono-font').forEach(el => { 
                        if (el.textContent.includes('GIFTS-POWERS')) el.childNodes[0].textContent = settings.brand_name.split(' ')[0] + ' '; 
                    });
                }
            }

            // 2. 同步后台产品价格与配置，并强行覆盖 3D 引擎的默认数据
            if (products && products.length > 0) {
                products.forEach(p => { 
                    window.GP.products[p.id] = p; 
                    // 如果前端 3D 引擎的 MODEL_CONFIGS 存在，直接把后台改的价格和标题赋进去！
                    if (window.MODEL_CONFIGS && window.MODEL_CONFIGS[p.id]) {
                        window.MODEL_CONFIGS[p.id].title = p.title;
                        window.MODEL_CONFIGS[p.id].spec = p.spec;
                        window.MODEL_CONFIGS[p.id].basePrice = Number(p.base_price);
                    }
                });

                // 立即刷新当前选中的 3D 模型标题与价格显示
                if (typeof window.selectProduct === 'function' && window.activeModelType) {
                    window.selectProduct(window.activeModelType);
                } else if (typeof window.calculatePrice === 'function') {
                    window.calculatePrice();
                }
            }
        } catch (err) {
            console.error('同步 Supabase 数据出错:', err);
        }
    }

    function escapeHtml(s='') { 
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); 
    }

    // 绑定询价表单提交事件
    document.addEventListener('DOMContentLoaded', () => {
        const form = $('#inquiry-modal form') || document.querySelector('form');
        if (form && !form.id) form.id = 'dynamic-inquiry-form';
    });

    window.handleFormSubmit = async function(e) {
        e.preventDefault();
        if (!sb) { alert('网站尚未连接 Supabase。'); return; }
        const form = e.target, fd = new FormData(form);
        const qty = Number($('#qty-slider')?.value || 500);
        const unit = Number(String($('#unit-price')?.textContent || '').replace(/[^0-9.]/g,'')) || null;
        const total = unit ? Number((unit * qty).toFixed(2)) : null;
        const product = window.GP.products[window.activeModelType || 'bottle'];
        
        const payload = {
            customer_name: String(fd.get('customer_name')||'').trim(), 
            phone: String(fd.get('phone')||'').trim(),
            company: String(fd.get('company')||'').trim(), 
            message: String(fd.get('message')||'').trim(),
            product_id: window.activeModelType || 'bottle', 
            product_title: product?.title || $('#model-title')?.textContent || '',
            quantity: qty, 
            craft: $('#craft-select')?.selectedOptions[0]?.textContent || '',
            estimated_unit_price: unit, 
            estimated_total: total
        };
        
        const { error } = await sb.from('inquiries').insert(payload);
        if (error) { alert(`提交失败：${error.message}`); return; }
        alert('询价已成功提交！后台已收到您的定制需求。');
        form.reset(); 
        if (typeof window.toggleModal === 'function') window.toggleModal(false);
    };

    // 页面加载完毕后立即向 Supabase 请求最新数据
    loadPublicContent();
})();
