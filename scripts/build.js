import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true })
}

// Run Vite build
exec('npm run build', { cwd: rootDir }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`)
    return
  }
  console.log(stdout)

  // Copy static files
  const staticFiles = [
    'manifest.json',
    'blocked.html',
    'onboarding.html',
    'icons'
  ]

  staticFiles.forEach(file => {
    const sourcePath = path.resolve(rootDir, 'public', file)
    const targetPath = path.resolve(distDir, file)

    if (fs.existsSync(sourcePath)) {
      if (fs.lstatSync(sourcePath).isDirectory()) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true })
        }
        fs.cpSync(sourcePath, targetPath, { recursive: true })
      } else {
        fs.copyFileSync(sourcePath, targetPath)
      }
    }
  })

  // Move background.js and contentScript.js to root
  const jsFiles = ['background.js', 'contentScript.js']
  jsFiles.forEach(file => {
    const sourcePath = path.resolve(distDir, 'assets', file)
    const targetPath = path.resolve(distDir, file)
    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, targetPath)
    }
  })

  // Update index.html to use correct asset paths
  const indexPath = path.resolve(distDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf-8')
    indexContent = indexContent.replace(/\/assets\//g, './assets/')
    fs.writeFileSync(indexPath, indexContent)
  }

  console.log('Build completed successfully!')
})
