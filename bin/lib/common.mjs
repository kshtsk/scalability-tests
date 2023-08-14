import {spawnSync} from 'child_process'
import {dirname, relative, join} from 'path'
import {cwd, env} from 'process'
import {fileURLToPath} from 'url'

export const ADMIN_PASSWORD = "adminadminadmin"

export function dir(dir){
    const desiredPath = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), dir)
    const currentPath = cwd()
    const result = relative(currentPath, desiredPath)

    return result !== "" ? result : "."
}

export function isK3d() {
    return terraformDir().endsWith("k3d")
}

export function terraformDir(){
    const default_dir = dir(join("terraform", "main", "k3d"))
    return env.TERRAFORM_WORK_DIR ?? default_dir
}

export function run(cmdline, options = {}) {
    console.log(`***Running command:\n ${cmdline}\n`)
    const res = spawnSync(cmdline, [], {
        input: options.input,
        stdio: [options.input ? "pipe": "inherit", options.collectingOutput ? "pipe" : "inherit", "inherit"],
        shell: true
    })
    if (res.error){
        throw res.error
    }
    if (res.status !== 0){
        throw new Error(`Command returned status ${res.status}`)
    }
    console.log("")
    return res.stdout?.toString()
}

/** Quotes a string for Unix shell use */
export function q(s){
    if (!/[^%+,-.\/:=@_0-9A-Za-z]/.test(s)){
        return s
    }
    return `'` + s.replace(/'/g, `'"'`) + `'`
}

export function runCollectingOutput(cmdline) {
    return run(cmdline, {collectingOutput: true})
}

export function runCollectingJSONOutput(cmdline) {
    return JSON.parse(runCollectingOutput(cmdline))
}

export function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s*1000));
}

export function helm_install(name, chart, cluster, namespace, values) {
    const json = Object.entries(values).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(",")
    run(`helm --kubeconfig=${q(cluster["kubeconfig"])} --kube-context=${q(cluster["context"])} upgrade --install --namespace=${q(namespace)} ${q(name)} ${q(chart)} --create-namespace --set-json=${q(json)}`)
}
