module "server_nodes" {
  count                 = var.server_count
  source                = "../ssh_host"
  project_name          = var.project_name
  ssh_addr              = var.ip_addr[count.index]
  ssh_user              = var.ssh_user
  name                  = "${var.name}-server-${count.index}"
  ssh_private_key_path  = var.ssh_private_key_path
  host_configuration_commands = var.host_configuration_commands
}

module "agent_nodes" {
  count                       = var.agent_count
  source                      = "../ssh_host"
  project_name                = var.project_name
  ssh_addr                    = var.ip_addr[var.server_count + count.index]
  ssh_user                    = var.ssh_user
  name                        = "${var.name}-agent-${count.index}"
  ssh_private_key_path        = var.ssh_private_key_path
  host_configuration_commands = var.host_configuration_commands
}

module "k3s" {
  source       = "../k3s"
  project      = var.project_name
  name         = var.name
  server_names = [for node in module.server_nodes : node.private_name]
  agent_names  = [for node in module.agent_nodes : node.private_name]
  agent_labels = var.agent_labels
  agent_taints = var.agent_taints
  remove_k3s   = true
  sans         = length(var.sans) > 0 ? var.sans : (var.server_count > 0 ? [module.server_nodes[0].private_name] : [])

  ssh_user                  = var.ssh_user
  ssh_private_key_path      = var.ssh_private_key_path
  local_kubernetes_api_port = var.local_kubernetes_api_port

  distro_version      = var.distro_version
  max_pods            = var.max_pods
  node_cidr_mask_size = var.node_cidr_mask_size
}
