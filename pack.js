import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { render } from 'ejs'
import { transformFromAst } from 'babel-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let chunkId = 1

function createAssets(path) {
    // 入口文件
    const source = readFileSync(path, {
        encoding: 'utf-8'
    })
    // ast解析
    const ast = parser.parse(source, { 
        sourceType: 'module'
    })
    // 收集依赖
    const deps = []
    traverse.default(ast, {
        ImportDeclaration({ node }) {
            deps.push(node.source.value)

        }
    })

    const { code } = transformFromAst(ast, null, {
        presets: ["env"],
    })

    return {
        filePath: path,
        source,
        code: code,
        deps,
    }
}

function createGraph(path) {
    const mainDir = dirname(path)
    const mainAsset = createAssets(path)
    const queue = [mainAsset]
    

    for (const asset of queue) {
        const mapping = asset.mapping = {}
        asset.deps.forEach((relativePath) => {
            const childPath = resolve(mainDir, relativePath)
            const childAsset = createAssets(childPath)
            mapping[relativePath] = chunkId++
            queue.push(childAsset)
        })
    }
    return queue
}

function build({ input, output }) {
    const template = readFileSync('template.ejs', {
        encoding: 'utf-8'
    })
    const entry = join(__dirname, input)
    const graph = createGraph(entry)
    const data = graph.map((asset, index) => {
        return {
            chunkId: asset.filePath,
            code: asset.code,
            mapping: asset.mapping,
        }
    })

    const code = render(template, {data})
    ensureDir(dirname(output))
    writeFileSync(output, code)
}

function ensureDir(path) {
    const dirPath = join(__dirname, path)
    if (existsSync(dirPath)) {
        return dirPath;
    }
    return mkdirSync(dirPath)
}

build({
    input: './src/main.js',
    output: './dist/bundle.js',
})