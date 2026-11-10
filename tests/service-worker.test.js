const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const scope of ['https://example.test/','https://example.test/project/']){
 const context=vm.createContext({URL,Request,self:{registration:{scope},addEventListener(){}}});
 vm.runInContext(fs.readFileSync('sw.js','utf8'),context);
 assert.equal(vm.runInContext('indexUrl',context),scope+'index.html');
 const urls=vm.runInContext('[...assetUrls]',context);
 for(const url of urls){assert.ok(url.startsWith(scope));const local=url.slice(scope.length)||'.';assert.ok(fs.existsSync(local),local);}
 assert.ok(urls.includes(scope+'zen/app.js'));assert.ok(urls.includes(scope+'coloring/index.html'));assert.ok(urls.includes(scope+'coloring/app.js'));assert.ok(urls.includes(scope+'water-sort/index.html'));
}
console.log('Offline snapshot bootstraps at root and GitHub Pages project paths; all assets exist');
