在 Vercel 项目设置中添加以下环境变量：

- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `GITHUB_DATA_PATH`
- `GITHUB_TOKEN`
- `ADMIN_TOKEN`

然后部署到 Vercel 即可。

权限说明：地图投稿、评价投稿和图片上传对所有访客开放；地图/评价的修改、删除以及主页管理工作台需要管理员令牌。

管理员令牌配置：

1. 在本地复制 `.env.example` 为 `.env.local`。
2. 将 `ADMIN_TOKEN` 改成一段随机且足够长的秘密字符串，例如使用密码管理器生成。
3. 在 Vercel 项目的 `Settings -> Environment Variables` 中新增同名变量 `ADMIN_TOKEN`，值必须与部署环境使用的令牌一致。
4. 修改 Vercel 环境变量后重新部署，令牌才会应用到新的函数实例。

进入主页的“管理工作台”后输入该令牌。令牌只用于验证管理员操作，不要写入客户端代码、公开仓库或提交到 Git。

用 iframe 嵌入：

```html
<iframe
  src="https://your-domain.vercel.app/embed?bg=rgba(8,12,22,0.45)"
  style="width:100%;height:900px;border:0;border-radius:20px;overflow:hidden;"
  loading="lazy"
></iframe>
```
