export class MyPlugin {
    apply(compiler) {
        console.log('MyPlugin 启动')

        compiler.hooks.emit.tap('MyPlugin', (context) => {
            // 可以理解为此次打包的上下文
            const code = context.getCode()
            console.log('代码体积大小:', code.length)
        })
    }
}