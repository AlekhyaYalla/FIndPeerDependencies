import axios from "axios";
import { PACKAGE, REPO, getPackages } from "./utils/getPackages";
var DomParser = require('dom-parser');

// var DomParser = require('dom-parser');

'use strict'
const mainDependency = "react";
const lockFilePath = "../1JS/midgard/yarn.lock"

function GetReactDepPkg(deps){
  let reactDeps = [];
  deps.forEach(pkg => {
    const dependencies = pkg.dependencies;
    if(dependencies != undefined){
      const reactKey = Object.keys(dependencies).find(k => k === mainDependency);
      if(reactKey)
      {
        reactDeps.push(pkg.key);
      }
    }
    
  });
  console.log("Dependencies with REACT as dependency:",reactDeps);
  return reactDeps;
}
function GetPeerDepPkg(deps){
  const packageJson = require('package-json');
  // console.log("Dependencies with REACT as peer-dependency:");
  deps.forEach(pkg => {
    (async () => {
      try{
        const pkgJson = await packageJson(pkg.name, pkg.version);
        if(pkgJson.peerDependencies != undefined
          &&  pkgJson["peerDependencies"][mainDependency] != undefined){
          // const reactKey = Object.keys(pkgJson.peerDependencies).filter(dep => dep === dependency);
          // if(reactKey){
            console.log(pkgJson.name,"@", pkgJson.version, ":",mainDependency,"---",pkgJson["peerDependencies"][mainDependency]);
          // }
        }
      }
      catch(error)
      {
        if(error.message.includes("could not be found") )
        {
          // console.log("Private package, making other call");
          DoGetCall(pkg.name, pkg.version);
        }
      }
    })();
    // axios.get(`https://unpkg.com/${pkg.name}@${pkg.version}/package.json`)
    //             .then(response => {
    //                 if (!response) {
    //                     throw new Error(`${pkg.name}@${pkg.version} ${response.statusText}`);
    //                 }
                
    //                 if (response.data && response.data.peerDependencies) {

    //                     var dataPkg = response.data as PACKAGE;
    //                     // console.log(response.data.peerDependencies);
    //                     // console.dir(dataPkg.peerDependencies);

    //                     for (let a in dataPkg.peerDependencies){
    //                         // peerMap.add(`${depPkgName}@${dependencies[depPkgName]}->${a}:${dataPkg.peerDependencies[a]}`);
    //                         console.log(`${pkg.name}@${pkg.version}` + " expects " + a+ " : " +dataPkg.peerDependencies[a]);
    //                     }
    //                 }
    //             }
    //             ).catch((e) => console.log(`ERR ${e}${pkg.name}@${pkg.version}`));

  });
};

function extractName(nameKey){
  let name;
  const delimiterCount = (nameKey.match(/@/g) || []).length;
  if(delimiterCount == 1){
    const splitted = nameKey.split("@", 2);
    name = splitted[0];
    // version = splitted[1];
  }
  if(delimiterCount == 2){
    const splitted = nameKey.split("@", 3);
    name = "@"+splitted[1];
    // version = splitted[2];
  }
  return name;
}

function GetAllLockDeps()
{
  const fs = require("fs");
  const { parse } = require("parse-yarn-lockfile");

  const content = fs.readFileSync(lockFilePath, { encoding: "utf-8" });
  const parsed = parse(content);
  const object = parsed.object;

  //Make an array of dependencies in lock file
  return  Object.keys(object).map(index => {
    let dep = object[index];
    dep.name = extractName(index);
    dep.key = index;
    return dep;
  });
}
function RemoveDuplicateDeps(deps){
  deps = deps.filter((value, index, self) =>
  index === self.findIndex((t) => (
    t.name === value.name && t.version === value.version
  ))
)
  return deps;
}

async function DoGetCall(dependency, version){
  try{
    // console.log("Method Started");
    return axios({
      // url: `https://pkgs.dev.azure.com/office/office/_apis/packaging/feeds/1JS/npm/packages/@ms/sharedcomments/versions/3.22.24/content?api-version=6.1-preview.1`,
      url: `https://office.visualstudio.com/Office/_packaging?_a=package&feed=1JS&package=`+dependency+`&protocolType=Npm&version=`+version,
      method: 'get',
      timeout: 30000,
      headers: {
          'Content-Type': 'text/html; charset=utf-8',
      },
      auth: {
        username: '',
        password: '<Your pat>'
      }})
      .then((res) => {
        var parser = new DomParser();
        var htmlDoc = parser.parseFromString(res.data, 'text/html');
        const dataProvider = htmlDoc.getElementById('dataProviders').textContent;
        const dataJson = JSON.parse(dataProvider);
        if(dataJson["data"]["ms.feed.package-hub-data-provider"] && dataJson["data"]["ms.feed.package-hub-data-provider"].packageDetailsResult
        && dataJson["data"]["ms.feed.package-hub-data-provider"].packageDetailsResult.packageVersion
        && dataJson["data"]["ms.feed.package-hub-data-provider"].packageDetailsResult.packageVersion.dependencies){
          const dependencies = dataJson["data"]["ms.feed.package-hub-data-provider"].packageDetailsResult.packageVersion.dependencies;
          const peerDependencies = dependencies.filter(obj => obj.group!= undefined && obj.group == "peerDependencies" 
          && obj.packageName == mainDependency);
          if(peerDependencies.length >0){
            // console.log("All",dependencies);
            console.log("PRIVATE",dependency, "@",version, peerDependencies);
          }
          // console.log("Done call: Data from response\n");
        }
      })
      .catch (err => console.error(err));
  }
  catch (err) {
    console.error("***********EXception***********",err);
  }
  console.log("Method done");
}


const deps = RemoveDuplicateDeps(GetAllLockDeps());
// const reactDeps = GetReactDepPkg(deps);
GetPeerDepPkg(deps);
// const version = "2.3.4";
// const str = `https://office.visualstudio.com/Office/_packaging?_a=package&feed=1JS&package=`+dependency+`&protocolType=Npm&version=`+version;
// console.log(str);

    





