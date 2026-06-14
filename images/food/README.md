# 面食品类配图（门脸图）

把对应品类的图片放在本目录（`images/food/`），文件名需与下表一致（`.jpg`）。
小程序会根据店名/品类自动匹配；**缺图也不会报错**，会自动回退到内置插画。

| 文件名 | 对应品类 |
|--------|----------|
| `beef.jpg` | 牛肉面 / 牛杂面 |
| `lanzhou.jpg` | 兰州拉面 |
| `xiaomian.jpg` | 重庆小面 |
| `daoxiao.jpg` | 刀削面 |
| `dandan.jpg` | 担担面 |
| `regan.jpg` | 热干面 |
| `zhajiang.jpg` | 炸酱面 |
| `wonton.jpg` | 馄饨面 / 抄手 |
| `luosifen.jpg` | 螺蛳粉 |
| `mixian.jpg` | 米线 / 米粉 |
| `qiaomian.jpg` | 荞面 |
| `default.jpg` | 兜底（未识别品类时） |

## 图片要求
- 建议尺寸 **750×420**（或同比例 16:9 左右），横图
- 体积尽量压到 **100KB 以内**，加载更快
- 选**暖色、热气腾腾、特写**的成品面照，最能勾食欲
- 注意版权：用自己拍的，或无版权素材站（Unsplash / Pexels / Pixabay 搜「noodles / ramen / 拉面」）

## 想用街景门脸代替本地图？
在 `utils/config.js` 把 `ENABLE_STREETVIEW` 改为 `true` 即可。
⚠️ 街景对店内小面馆覆盖率有限，且每次会消耗地图配额，建议谨慎开启。
