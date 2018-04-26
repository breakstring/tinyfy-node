# tinyfy-node

TinyPNG/TinyJPG 的命令行工具，可以根据你的配置来切换多个API Key，同时也支持在压缩过程中对图像进行缩放裁剪。

TinyPNG/TinyJPG command line tools, which can switch multiple tinify api keys by your config. And also can resize the images during the compressing.

## install

```shell
git clone https://github.com/breakstring/tinyfy-node.git
npm install
```

## config

你可以配置该工具使用命令行参数，或者环境变量，或者config.json文件。

You can config the parameters with command line args or enviroment variables or config.json file.

### 参数

- **tinifykey**: tinypng api keys. 如果有多个key:
  - 命令行模式: 重复参数即可
  - 环境变量: 多个 key 用逗号","分割。
  - config.json : 字符串数组

- **sourcedir**: 图片源文件夹

- **distdir**: 图片目标文件夹

- resizemethod: 可选参数。缩放裁剪方式，支持的参数有 resize method, support scale_width, scale_height, fit, cover,thumb. 具体参见  https://tinypng.com/developers/reference/nodejs .

- width: 可选参数，宽度

- height: 可选参数：高度

### parameters

- **tinifykey**: tinypng api keys. If you have multiple keys:
  - commandlien args: repeate the args
  - enviroment variable: separate with ","
  - config.json : string arrary.

- **sourcedir**: source folder with the pictures

- **distdir**: dist folder to storage the compressed pictures.

- resizemethod: resize method, support scale_width, scale_height, fit, cover,thumb. The detail refer to https://tinypng.com/developers/reference/nodejs ; Optional.

- width: resized with width. Optional.

- height: resized with height. Optional.


## about tinyPNG / tinyJPG

tinyPNG/tinyJPG 是一个免费的压缩图片的服务，您可以直接在他们的网站上使用服务。 https://tinypng.com/ 或者 https://tinyjpg.com/ 。 您也可以从 https://tinypng.com/developers 申请免费的 API Key 来使用我这个工具，或者基于官方 API 接口来写一个顺手的工具。当然，免费的 key 每个月只有 500 次压缩/缩放图片的限额。

tinyPNG is a free service, you can compress your picture from the web portal https://tinypng.com/ or https://tinyjpg.com/ . You can also request a free api key from https://tinypng.com/developers to use this tool, or write another better gear.