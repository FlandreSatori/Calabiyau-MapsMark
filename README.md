# MapsMark

一个面向地图投稿、评价、排行和雷达图展示的 Next.js 应用，可部署到 Vercel，并通过 GitHub 仓库里的 JSON 文件作为中心数据源。

## 功能

- 投稿地图信息：封面、预览图、地图代码、类型、名称、作者、制图时间、介绍、预计游玩时间
- 提交五星评价：趣味性、美观性、引导性、难易度、总体评价
- 所有人可查看历史数据、时间戳、排行榜和雷达图
- 管理员可通过后台删改地图与评价
- 支持自定义半透明背景
- 提供适合嵌入 Vue3 的 `/embed` 页面

## 本地开发

1. 安装依赖
2. 复制 `.env.example` 为 `.env.local`
3. 配置 GitHub 仓库和管理员令牌
4. 启动开发服务器：`npm run dev`

## Vercel 部署

在 Vercel 项目设置中添加以下环境变量：

- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `GITHUB_DATA_PATH`
- `GITHUB_TOKEN`
- `ADMIN_TOKEN`

然后部署到 Vercel 即可。

## Vue3 嵌入

可以直接用 iframe 嵌入：

```html
<iframe
  src="https://your-domain.vercel.app/embed?bg=rgba(8,12,22,0.45)"
  style="width:100%;height:900px;border:0;border-radius:20px;overflow:hidden;"
  loading="lazy"
></iframe>
```
