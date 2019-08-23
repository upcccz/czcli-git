#!/usr/bin/env node

// 处理命令行参数
const program = require('commander');
// 用来下载github上的模板
const download = require('download-git-repo');
// 文件模块
const fs = require('fs');
// 操作文件
const handlebars = require('handlebars');
// loading
const ora = require('ora')
// 命令行字体颜色
const chalk = require('chalk')
// 交互式命令行,可在控制台提问
const inquirer = require('inquirer')
// 控制终端命令
const shell = require('shelljs');
// 模版对象
const templates = require('./template.js');
// 图标
const logSymbols = require('log-symbols');

program
  .version(require('./package.json').version)
 
program
  .command('init <templateName> <projectName>')
  .description('初始化项目模板')
  .action(function(templateName, projectName){

    const spinner = ora('downloading template').start();

    // 根据模板名下载对应的模板到本地并起名为projectName

    // 下载
    // 第一个参数：仓库地址
    // 第二个参数：下载到哪个路径
    const { downloadUrl } = templates[templateName];
    download(downloadUrl, projectName, { clone : true}, err => {
      if (err) {
        spinner.fail();
        return console.log(logSymbols.error, chalk.red('Failed to download template'));
      }
      // 根据与用户交互修改package.json
      spinner.succeed();
      inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          default: 'my-pro',
          message: 'Project name'
        },
        {
          type: 'input',
          name: 'description',
          default: 'A Vue.js project',
          message: 'what\'s your project description'
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author'
        }
      ]).then(answers => {
        console.log(answers);
        const packagePath = `${projectName}/package.json`;
        const packageContent = fs.readFileSync(packagePath,'utf8');
        const result = handlebars.compile(packageContent)(answers)
        fs.writeFileSync(packagePath, result);
        console.log(logSymbols.success, chalk.green('download template successfully'));
        inquirer.prompt([
          {
            type:'confirm',
            name: 'isUseNpm',
            message: 'Whether to install dependencies using npm install'
          }
        ]).then(answers => {
          if (answers.isUseNpm) {
            shell.cd(process.cwd() + '/' + projectName);
            const spinner1 = ora('Installing project dependencies ... \n').start();
            
            if (shell.exec('npm install').code !== 0) {//执行npm install 命令
              spinner1.fail();
              shell.echo('Error: install failed');
              shell.exit(1);
            } else {
              spinner1.succeed();
              console.log(logSymbols.success, chalk.green('installation completed'));
              console.log();
              console.log('To get started:');
              console.log();
              console.log(chalk.yellow(`   cd ${projectName}`));
              console.log(chalk.yellow('   npm run dev'));
              console.log();
            }
          }
        })
      })
    })
  });

program
  .command('list')
  .description('查看所有可用的模板')
  .action(() => {
    for (const key in templates) {
      console.log(`${key}: ${templates[key].description}`);
    }
  })
 
program.parse(process.argv);