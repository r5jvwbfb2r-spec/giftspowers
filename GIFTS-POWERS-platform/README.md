# GIFTS-POWERS 礼蕴力量｜3D 礼品定制平台

基于原始 Three.js 前端设计，增加 Supabase 数据库、管理员认证、内容管理、产品参数管理、询价收件箱与 Vercel 部署配置。

## 功能
- 前台：保留原始深色科技风、Three.js 保温杯/马克杯/纪念币模型、旋转/灯光/线框、颜色与 LOGO 上传、数量和工艺试算。
- 数据联动：前台启动时从 Supabase 读取站点设置与产品参数；管理员保存后刷新前台即可看到更新。
- 询价：前台表单将姓名、电话、公司、需求、产品、数量、工艺及试算金额写入 `inquiries`。
- 后台：管理员登录；编辑站点标题/副标题/联系方式；编辑三种 3D 产品名称、规格、基础价；管理询价状态、备注及删除。
- 安全：前台只使用 Supabase anon key；RLS 禁止匿名读取/修改后台数据；匿名用户仅可提交询价；后台操作要求 Supabase Auth 登录。

## 1. 创建 Supabase
1. 新建 Supabase 项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql` 全部内容。
3. 在 Authentication → Users 中邀请/创建管理员用户（不要开放公开注册）。
4. 在 Project Settings → API 复制 Project URL 和 anon/public key。
5. 编辑 `public/config.js`，填入 URL 和 anon key。

## 2. 本地运行
可直接用 VS Code Live Server，或在项目根目录运行：

```bash
npx serve public
```

后台地址：`/admin/`。本地静态服务器必须从项目根目录启动，使 `/admin/` 可访问。

## 3. GitHub + Vercel 部署
1. 将整个项目目录推送到 GitHub 仓库。
2. Vercel → Add New → Project → 导入该仓库。
3. Framework Preset 选 **Other**；Root Directory 保持项目根目录；Build Command 留空；Output Directory 填 `public`。
4. 部署完成后，前台为域名根路径，后台为 `https://你的域名/admin/`。
5. 在 Supabase Authentication → URL Configuration 中，将 Site URL 设置为正式域名，并将 `https://你的域名/**` 加入 Redirect URLs。

## 4. 安全与上线前必做
- 不要把 `service_role` key 放进任何前端文件。
- Supabase anon key 可以公开，真正的权限由 RLS 控制。
- 管理员用户请由项目所有者在 Supabase Dashboard 创建；不要启用开放注册。
- 价格当前为前端试算参考价，正式报价以人工确认为准。可在后台更新基础价和工艺倍率。
- 联系方式、交期、产品图及真实库存尚需由你提供/确认；当前保留原设计中的示例内容。
- 建议上线前配置 Supabase 数据库备份、邮件通知（可后续接 Edge Function/邮件服务）和自有域名。

## 目录
```
public/                 前台站点（Vercel 静态输出目录）
  index.html             3D 定制前台
  config.js              Supabase 公共配置
  app.js                 前台数据联动及询价提交
public/admin/            管理后台
  index.html
  admin.js
supabase/schema.sql      数据库表、初始数据、RLS 策略
vercel.json              Vercel 路由配置
```
