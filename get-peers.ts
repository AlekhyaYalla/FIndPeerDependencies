import axios from "axios";
import { PACKAGE, REPO, getPackages } from "./utils/getPackages";
var DomParser = require('dom-parser');

// var DomParser = require('dom-parser');

'use strict'
const dependency = "react";
const lockFilePath = "./yarn.lock"

function GetReactDepPkg(deps){
  let reactDeps = [];
  deps.forEach(pkg => {
    const dependencies = pkg.dependencies;
    if(dependencies != undefined){
      const reactKey = Object.keys(dependencies).find(k => k === dependency);
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
  let reactPeers = [];  
  console.log("Dependencies with REACT as peer-dependency:");
  deps.forEach(pkg => {
    (async () => {
      try{
        const pkgJson = await packageJson(pkg.name, pkg.version);
        if(pkgJson.peerDependencies != undefined){
          const reactKey = Object.keys(pkgJson.peerDependencies).find(dep => dep === dependency);
          if(reactKey){
            console.log(pkg.name, pkg.version);
            reactPeers.push(pkg.key);
          }
        }
      }
      catch(error)
      {
        // if((<Error>error).message.includes("PackageNotFoundError") )
        //   console.log(pkg.dependencyName, " is not in public registry");
        console.log(error);
      }
    }
    )();
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

export interface MyObj {
  'ms.vss-web.component-data': Object;
}

async function DoGetCall(dependency, version){
  try{
    console.log("Method Started");
    return axios({
      // url: `https://pkgs.dev.azure.com/office/office/_apis/packaging/feeds/1JS/npm/packages/@ms/sharedcomments/versions/3.22.24/content?api-version=6.1-preview.1`,
      url: `https://office.visualstudio.com/Office/_packaging?_a=package&feed=1JS&package=office-ui-fabric-react&protocolType=Npm&version=7.180.3`,
      method: 'get',
      timeout: 30000,
      headers: {
          'Content-Type': 'text/html; charset=utf-8',
      },
      auth: {
        username: '',
        password: 'pnoalzmhien636k6ynceucf4s5foqmpduxyetsrrmuutc6kd7jma'
      }})
      .then((res) => {
        var parser = new DomParser();
        var htmlDoc = parser.parseFromString(res.data, 'text/html');
        const dataProvider = htmlDoc.getElementById('dataProviders').textContent;
        const dataJson = JSON.parse(dataProvider);
        
        // let jsonObj: any = JSON.parse(dataProvider); // string to generic object first
        // let employee: MyObj = <MyObj>jsonObj;
        // var x = dataJson.data."ms.vss-web.component-data";
        const dependencies = dataJson["data"]["ms.feed.package-hub-data-provider"].packageDetailsResult.packageVersion.dependencies;
        const peerDependencies = dependencies.filter(obj => obj.group!= undefined && obj.group == "peerDependencies");
        console.log("My test:\n", dependencies);
        console.log("Done call: Data from response\n");
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

    





