/**
 * Comprehensive Azure Resource Type Definitions
 * Includes all major Azure services with Draw.io stencils and containment rules
 */

export interface ResourceDefinition {
  type: string;
  displayName: string;
  icon: string;
  width: number;
  height: number;
  canContain?: string[];  // Resource types this can contain
  containedBy?: string[]; // Resource types this can be inside
  isContainer?: boolean;  // Uses swimlane style
  containerStyle?: string;
  category: ResourceCategory;
}

export type ResourceCategory = 
  | 'hierarchy'
  | 'compute' 
  | 'networking' 
  | 'storage' 
  | 'databases' 
  | 'security' 
  | 'integration' 
  | 'ai' 
  | 'analytics'
  | 'monitoring'
  | 'identity'
  | 'migration'
  | 'iot'
  | 'devops'
  | 'web'
  | 'management'
  | 'other';

// Draw.io Azure icon paths (built into Draw.io)
export const AZURE_ICONS = {
  // ==================== HIERARCHY ====================
  subscription: 'img/lib/azure2/general/Subscriptions.svg',
  resourceGroup: 'img/lib/mscae/ResourceGroup.svg',
  managementGroup: 'img/lib/azure2/general/Management_Groups.svg',

  // ==================== COMPUTE ====================
  vm: 'img/lib/azure2/compute/Virtual_Machine.svg',
  vmss: 'img/lib/azure2/compute/VM_Scale_Sets.svg',
  availabilitySet: 'img/lib/azure2/compute/Availability_Sets.svg',
  disk: 'img/lib/azure2/compute/Disks.svg',
  image: 'img/lib/azure2/compute/Images.svg',
  functionApp: 'img/lib/azure2/compute/Function_Apps.svg',
  appService: 'img/lib/azure2/containers/App_Services.svg',
  appServicePlan: 'img/lib/azure2/app_services/App_Service_Plans.svg',
  containerInstance: 'img/lib/azure2/compute/Container_Instances.svg',
  containerRegistry: 'img/lib/azure2/containers/Container_Registries.svg',
  aks: 'img/lib/azure2/containers/Kubernetes_Services.svg',
  serviceFabric: 'img/lib/azure2/compute/Service_Fabric_Clusters.svg',
  batch: 'img/lib/azure2/compute/Batch_Accounts.svg',
  cloudService: 'img/lib/azure2/compute/Cloud_Services_Classic.svg',
  restorePoint: 'img/lib/azure2/compute/Restore_Points_Collections.svg',
  avs: 'img/lib/azure2/azure_vmware_solution/AVS.svg',
  avsVm: 'img/lib/azure2/other/AVS_VM.svg',
  containerApp: 'img/lib/azure2/other/Worker_Container_App.svg',
  containerAppEnv: 'img/lib/azure2/other/Container_App_Environments.svg',
  avd: 'img/lib/azure2/other/Windows_Virtual_Desktop.svg',

  // ==================== NETWORKING ====================
  vnet: 'img/lib/azure2/networking/Virtual_Networks.svg',
  subnet: 'img/lib/azure2/networking/Virtual_Networks.svg', // No separate subnet icon, use vnet
  nsg: 'img/lib/azure2/networking/Network_Security_Groups.svg',
  asg: 'img/lib/azure2/security/Application_Security_Groups.svg',
  nic: 'img/lib/azure2/networking/Network_Interfaces.svg',
  publicIp: 'img/lib/azure2/networking/Public_IP_Addresses.svg',
  publicIpPrefix: 'img/lib/azure2/networking/Public_IP_Prefixes.svg',
  loadBalancer: 'img/lib/azure2/networking/Load_Balancers.svg',
  appGateway: 'img/lib/azure2/networking/Application_Gateways.svg',
  waf: 'img/lib/azure2/networking/Web_Application_Firewall_Policies_WAF.svg',
  firewall: 'img/lib/azure2/networking/Firewalls.svg',
  firewallPolicy: 'img/lib/azure2/networking/Firewalls.svg',
  nat: 'img/lib/azure2/networking/NAT.svg',
  bastion: 'img/lib/azure2/networking/Bastions.svg',
  vpnGateway: 'img/lib/azure2/networking/Virtual_Network_Gateways.svg',
  localNetworkGateway: 'img/lib/azure2/networking/Local_Network_Gateways.svg',
  expressRoute: 'img/lib/azure2/networking/ExpressRoute_Circuits.svg',
  expressRouteDirect: 'img/lib/azure2/other/ExpressRoute_Direct.svg',
  connection: 'img/lib/azure2/networking/Connections.svg',
  vwan: 'img/lib/azure2/networking/Virtual_WANs.svg',
  vhub: 'img/lib/azure2/networking/Virtual_WANs.svg',
  privateEndpoint: 'img/lib/azure2/networking/Private_Endpoint.svg',
  privateLink: 'img/lib/azure2/networking/Private_Link.svg',
  privateLinkService: 'img/lib/azure2/networking/Private_Link_Service.svg',
  dns: 'img/lib/azure2/networking/DNS_Zones.svg',
  privateDns: 'img/lib/azure2/networking/DNS_Zones.svg',
  trafficManager: 'img/lib/azure2/networking/Traffic_Manager_Profiles.svg',
  frontDoor: 'img/lib/azure2/networking/Front_Doors.svg',
  cdn: 'img/lib/azure2/networking/CDN_Profiles.svg',
  ddosProtection: 'img/lib/azure2/networking/DDoS_Protection_Plans.svg',
  routeTable: 'img/lib/azure2/networking/Route_Tables.svg',
  routeFilter: 'img/lib/azure2/networking/Route_Filters.svg',
  networkWatcher: 'img/lib/azure2/networking/Network_Watcher.svg',
  networkManager: 'img/lib/azure2/other/Azure_Network_Manager.svg',
  ipGroup: 'img/lib/azure2/networking/IP_Groups.svg',
  serviceEndpoint: 'img/lib/azure2/networking/Service_Endpoint_Policies.svg',
  proximityGroup: 'img/lib/azure2/networking/Proximity_Placement_Groups.svg',

  // ==================== STORAGE ====================
  storageAccount: 'img/lib/azure2/storage/Storage_Accounts.svg',
  dataLake: 'img/lib/azure2/storage/Data_Lake_Storage_Gen1.svg',
  netAppFiles: 'img/lib/azure2/storage/Azure_NetApp_Files.svg',

  // ==================== DATABASES ====================
  cosmosDb: 'img/lib/azure2/databases/Azure_Cosmos_DB.svg',
  sqlServer: 'img/lib/azure2/databases/SQL_Server.svg',
  sqlDatabase: 'img/lib/azure2/databases/SQL_Database.svg',
  sqlManagedInstance: 'img/lib/azure2/databases/SQL_Managed_Instance.svg',
  sqlElasticPool: 'img/lib/azure2/databases/SQL_Elastic_Pools.svg',
  sqlVm: 'img/lib/azure2/databases/Azure_SQL_VM.svg',
  mysql: 'img/lib/azure2/databases/Azure_Database_MySQL_Server.svg',
  postgresql: 'img/lib/azure2/databases/Azure_Database_PostgreSQL_Server.svg',
  postgresqlFlex: 'img/lib/azure2/databases/Azure_Database_PostgreSQL_Server_Group.svg',
  mariadb: 'img/lib/azure2/databases/Azure_Database_MariaDB_Server.svg',
  redis: 'img/lib/azure2/databases/Cache_Redis.svg',
  dataExplorer: 'img/lib/azure2/databases/Azure_Data_Explorer_Clusters.svg',
  purview: 'img/lib/azure2/databases/Azure_Purview_Accounts.svg',
  dms: 'img/lib/azure2/databases/Azure_Database_Migration_Services.svg',
  managedDb: 'img/lib/azure2/databases/Managed_Database.svg',
  virtualCluster: 'img/lib/azure2/databases/Virtual_Clusters.svg',
  elasticJobAgent: 'img/lib/azure2/databases/Elastic_Job_Agents.svg',

  // ==================== SECURITY ====================
  keyVault: 'img/lib/azure2/security/Key_Vaults.svg',
  defender: 'img/lib/azure2/security/Azure_Defender.svg',
  sentinel: 'img/lib/azure2/security/Azure_Sentinel.svg',
  managedHsm: 'img/lib/azure2/security/Key_Vaults.svg',

  // ==================== INTEGRATION ====================
  apiManagement: 'img/lib/azure2/integration/API_Management_Services.svg',
  serviceBus: 'img/lib/azure2/integration/Service_Bus.svg',
  eventGrid: 'img/lib/azure2/integration/Event_Grid_Topics.svg',
  eventGridSub: 'img/lib/azure2/integration/Event_Grid_Subscriptions.svg',
  systemTopic: 'img/lib/azure2/integration/System_Topic.svg',
  logicApp: 'img/lib/azure2/integration/Logic_Apps.svg',
  logicAppConnector: 'img/lib/azure2/integration/Logic_Apps_Custom_Connector.svg',
  integrationAccount: 'img/lib/azure2/integration/Integration_Accounts.svg',
  appConfig: 'img/lib/azure2/integration/App_Configuration.svg',
  dataCatalog: 'img/lib/azure2/integration/Azure_Data_Catalog.svg',
  relay: 'img/lib/azure2/integration/Relays.svg',

  // ==================== AI/ML ====================
  cognitiveServices: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  machineLearning: 'img/lib/azure2/ai_machine_learning/Machine_Learning.svg',
  botService: 'img/lib/azure2/ai_machine_learning/Bot_Services.svg',
  // OpenAI uses cognitive services icon (no dedicated icon in standard set)
  openAI: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  aiSearch: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  aiFoundry: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  documentIntelligence: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  speechService: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  computerVision: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  languageService: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',
  contentSafety: 'img/lib/azure2/ai_machine_learning/Cognitive_Services.svg',

  // ==================== ANALYTICS ====================
  databricks: 'img/lib/azure2/analytics/Azure_Databricks.svg',
  synapse: 'img/lib/azure2/analytics/Azure_Synapse_Analytics.svg',
  analysisServices: 'img/lib/azure2/analytics/Analysis_Services.svg',
  eventHub: 'img/lib/azure2/iot/Event_Hubs.svg',
  powerPlatform: 'img/lib/azure2/analytics/Power_Platform.svg',
  dataFactory: 'img/lib/azure2/analytics/Data_Factory.svg',
  streamAnalytics: 'img/lib/azure2/analytics/Stream_Analytics_Jobs.svg',
  hdInsight: 'img/lib/azure2/analytics/HD_Insight_Clusters.svg',
  powerBiEmbedded: 'img/lib/azure2/analytics/Power_BI_Embedded.svg',
  fabric: 'img/lib/azure2/analytics/Azure_Synapse_Analytics.svg',

  // ==================== MONITORING ====================
  appInsights: 'img/lib/azure2/devops/Application_Insights.svg',
  monitor: 'img/lib/azure2/management_governance/Monitor.svg',
  actionGroup: 'img/lib/azure2/management_governance/Activity_Log.svg',
  alerts: 'img/lib/azure2/management_governance/Alerts.svg',
  logAnalytics: 'img/lib/azure2/management_governance/Log_Analytics_Workspaces.svg',

  // ==================== IDENTITY ====================
  azureAd: 'img/lib/azure2/identity/Azure_Active_Directory.svg',
  managedIdentity: 'img/lib/azure2/identity/Managed_Identities.svg',
  entraIdB2c: 'img/lib/azure2/identity/Azure_AD_B2C.svg',

  // ==================== MIGRATION ====================
  migrate: 'img/lib/azure2/migrate/Azure_Migrate.svg',

  // ==================== IoT ====================
  iotHub: 'img/lib/azure2/iot/IoT_Hub.svg',
  iotCentral: 'img/lib/azure2/iot/IoT_Central_Applications.svg',
  digitalTwins: 'img/lib/azure2/iot/Digital_Twins.svg',
  timeSeriesInsights: 'img/lib/azure2/iot/Time_Series_Insights_Environments.svg',

  // ==================== DevOps ====================
  devops: 'img/lib/azure2/devops/Azure_DevOps.svg',
  devTestLab: 'img/lib/azure2/devops/DevTest_Labs.svg',

  // ==================== MANAGEMENT ====================
  automationAccount: 'img/lib/azure2/management_governance/Automation_Accounts.svg',
  recoveryVault: 'img/lib/azure2/management_governance/Recovery_Services_Vaults.svg',
  backupCenter: 'img/lib/azure2/other/Azure_Backup_Center.svg',
  arcMachine: 'img/lib/azure2/management_governance/MachinesAzureArc.svg',
  templateSpec: 'img/lib/azure2/other/Template_Specs.svg',
  costAnalysis: 'img/lib/azure2/general/Cost_Analysis.svg',
  grafana: 'img/lib/azure2/other/Grafana.svg',
  dashboard: 'img/lib/azure2/other/Dashboard_Hub.svg',
  workbook: 'img/lib/azure2/general/Workbooks.svg',
  policy: 'img/lib/azure2/management_governance/Policy.svg',
  blueprints: 'img/lib/azure2/management_governance/Blueprints.svg',
  advisor: 'img/lib/azure2/management_governance/Advisor.svg',
  serviceHealth: 'img/lib/azure2/management_governance/Service_Health.svg',
  resourceGraph: 'img/lib/azure2/management_governance/Resource_Graph_Explorer.svg',

  // ==================== WEB ====================
  staticWebApp: 'img/lib/azure2/app_services/App_Service_Environments.svg',
  signalR: 'img/lib/azure2/web/SignalR.svg',
  notificationHub: 'img/lib/azure2/web/Notification_Hubs.svg',
  communicationService: 'img/lib/azure2/web/Azure_Communication_Services.svg',
  webSlot: 'img/lib/azure2/general/Web_Slots.svg',
  webTest: 'img/lib/azure2/general/Web_Test.svg',
  mediaService: 'img/lib/azure2/web/Azure_Media_Service.svg',
  appServiceDomain: 'img/lib/azure2/app_services/App_Service_Domains.svg',

  // ==================== GENERAL/SYMBOLS ====================
  error: 'img/lib/azure2/general/Error.svg',
  info: 'img/lib/azure2/general/Information.svg',
  launchPortal: 'img/lib/azure2/general/Launch_Portal.svg',
  devConsole: 'img/lib/azure2/general/Dev_Console.svg',
  onPremises: 'img/lib/mscae/Exchange_On_premises_Access.svg',
  detonation: 'img/lib/azure2/other/Detonation.svg',
} as const;

// Container styles for different hierarchy levels
export const CONTAINER_STYLES = {
  subscription: 'swimlane;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;rounded=1;fontStyle=1;fontSize=14;',
  resourceGroup: 'swimlane;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;rounded=1;fontStyle=1;',
  vnet: 'swimlane;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;swimlaneFillColor=#D5E8D4;rounded=1;fontStyle=1;',
  vnetHub: 'swimlane;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;swimlaneFillColor=#DAE8FC;rounded=1;fontStyle=1;',
  subnet: 'swimlane;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;swimlaneFillColor=#E1D5E7;rounded=1;',
  region: 'swimlane;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;rounded=1;fontStyle=1;fontSize=14;',
  availabilityZone: 'swimlane;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;rounded=1;dashed=1;',
  onPremises: 'swimlane;whiteSpace=wrap;html=1;fillColor=#d0cee2;strokeColor=#56517e;rounded=1;fontStyle=1;',
  broken: 'swimlane;whiteSpace=wrap;html=1;fillColor=#fad9d5;strokeColor=#ae4132;swimlaneFillColor=#FAD9D5;',
} as const;

export const RESOURCES: Record<string, ResourceDefinition> = {
  // ==================== HIERARCHY ====================
  'region': {
    type: 'region',
    displayName: 'Azure Region',
    icon: AZURE_ICONS.subscription,
    width: 44, height: 71,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.region,
    canContain: ['subscription', 'resourceGroup', 'vnet', 'availabilityZone'],
    category: 'hierarchy',
  },
  'availabilityZone': {
    type: 'availabilityZone',
    displayName: 'Availability Zone',
    icon: AZURE_ICONS.availabilitySet,
    width: 40, height: 40,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.availabilityZone,
    containedBy: ['region', 'vnet'],
    canContain: ['vm', 'vmss'],
    category: 'hierarchy',
  },
  'subscription': {
    type: 'subscription',
    displayName: 'Subscription',
    icon: AZURE_ICONS.subscription,
    width: 44, height: 71,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.subscription,
    canContain: ['resourceGroup'],
    category: 'hierarchy',
  },
  'managementGroup': {
    type: 'microsoft.management/managementgroups',
    displayName: 'Management Group',
    icon: AZURE_ICONS.managementGroup,
    width: 50, height: 50,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.subscription,
    canContain: ['subscription', 'managementGroup'],
    category: 'hierarchy',
  },
  'resourceGroup': {
    type: 'microsoft.resources/resourcegroups',
    displayName: 'Resource Group',
    icon: AZURE_ICONS.resourceGroup,
    width: 37.5, height: 30,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.resourceGroup,
    containedBy: ['subscription', 'region'],
    canContain: ['vnet', 'storageAccount', 'cosmosDb', 'sqlServer', 'keyVault', 'appService', 'functionApp', 'aks', 'vm', 'loadBalancer', 'expressRoute', 'vwan'],
    category: 'hierarchy',
  },
  'onPremises': {
    type: 'onPremises',
    displayName: 'On-Premises',
    icon: AZURE_ICONS.onPremises,
    width: 168, height: 290,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.onPremises,
    canContain: ['localNetworkGateway', 'vm'],
    category: 'hierarchy',
  },

  // ==================== NETWORKING - CORE ====================
  'vnet': {
    type: 'microsoft.network/virtualnetworks',
    displayName: 'Virtual Network',
    icon: AZURE_ICONS.vnet,
    width: 67, height: 40,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.vnet,
    containedBy: ['resourceGroup', 'region'],
    canContain: ['subnet'],
    category: 'networking',
  },
  'hubVnet': {
    type: 'microsoft.network/virtualnetworks',
    displayName: 'Hub Virtual Network',
    icon: AZURE_ICONS.vnet,
    width: 67, height: 40,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.vnetHub,
    containedBy: ['resourceGroup', 'region'],
    canContain: ['subnet'],
    category: 'networking',
  },
  'subnet': {
    type: 'microsoft.network/virtualnetworks/subnets',
    displayName: 'Subnet',
    icon: AZURE_ICONS.subnet,
    width: 60, height: 40,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.subnet,
    containedBy: ['vnet', 'hubVnet'],
    canContain: ['vm', 'aks', 'privateEndpoint', 'loadBalancer', 'appGateway', 'firewall', 'bastion', 'vpnGateway', 'apiManagement', 'appService', 'containerInstance'],
    category: 'networking',
  },
  'nsg': {
    type: 'microsoft.network/networksecuritygroups',
    displayName: 'Network Security Group',
    icon: AZURE_ICONS.nsg,
    width: 50, height: 61,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'asg': {
    type: 'microsoft.network/applicationsecuritygroups',
    displayName: 'Application Security Group',
    icon: AZURE_ICONS.asg,
    width: 50, height: 44,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== NETWORKING - LOAD BALANCING ====================
  'loadBalancer': {
    type: 'microsoft.network/loadbalancers',
    displayName: 'Load Balancer',
    icon: AZURE_ICONS.loadBalancer,
    width: 72, height: 72,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'networking',
  },
  'appGateway': {
    type: 'microsoft.network/applicationgateways',
    displayName: 'Application Gateway',
    icon: AZURE_ICONS.appGateway,
    width: 64, height: 64,
    containedBy: ['subnet'],
    category: 'networking',
  },
  'waf': {
    type: 'microsoft.network/applicationgatewaywebapplicationfirewallpolicies',
    displayName: 'WAF Policy',
    icon: AZURE_ICONS.waf,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'frontDoor': {
    type: 'microsoft.network/frontdoors',
    displayName: 'Front Door',
    icon: AZURE_ICONS.frontDoor,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'trafficManager': {
    type: 'microsoft.network/trafficmanagerprofiles',
    displayName: 'Traffic Manager',
    icon: AZURE_ICONS.trafficManager,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'cdn': {
    type: 'microsoft.cdn/profiles',
    displayName: 'CDN',
    icon: AZURE_ICONS.cdn,
    width: 64, height: 52,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== NETWORKING - SECURITY ====================
  'firewall': {
    type: 'microsoft.network/azurefirewalls',
    displayName: 'Azure Firewall',
    icon: AZURE_ICONS.firewall,
    width: 71, height: 60,
    containedBy: ['subnet'],
    category: 'networking',
  },
  'bastion': {
    type: 'microsoft.network/bastionhosts',
    displayName: 'Bastion',
    icon: AZURE_ICONS.bastion,
    width: 50, height: 50,
    containedBy: ['subnet'],
    category: 'networking',
  },
  'ddosProtection': {
    type: 'microsoft.network/ddosprotectionplans',
    displayName: 'DDoS Protection',
    icon: AZURE_ICONS.ddosProtection,
    width: 50, height: 61,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'nat': {
    type: 'microsoft.network/natgateways',
    displayName: 'NAT Gateway',
    icon: AZURE_ICONS.nat,
    width: 65, height: 52,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'networking',
  },

  // ==================== NETWORKING - CONNECTIVITY ====================
  'vpnGateway': {
    type: 'microsoft.network/virtualnetworkgateways',
    displayName: 'VPN Gateway',
    icon: AZURE_ICONS.vpnGateway,
    width: 52, height: 69,
    containedBy: ['subnet'],
    category: 'networking',
  },
  'localNetworkGateway': {
    type: 'microsoft.network/localnetworkgateways',
    displayName: 'Local Network Gateway',
    icon: AZURE_ICONS.localNetworkGateway,
    width: 68, height: 68,
    containedBy: ['resourceGroup', 'onPremises'],
    category: 'networking',
  },
  'expressRoute': {
    type: 'microsoft.network/expressroutecircuits',
    displayName: 'ExpressRoute Circuit',
    icon: AZURE_ICONS.expressRoute,
    width: 70, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'expressRouteDirect': {
    type: 'microsoft.network/expressrouteports',
    displayName: 'ExpressRoute Direct',
    icon: AZURE_ICONS.expressRouteDirect,
    width: 70, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'connection': {
    type: 'microsoft.network/connections',
    displayName: 'Connection',
    icon: AZURE_ICONS.connection,
    width: 68, height: 68,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'vwan': {
    type: 'microsoft.network/virtualwans',
    displayName: 'Virtual WAN',
    icon: AZURE_ICONS.vwan,
    width: 65, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'vhub': {
    type: 'microsoft.network/virtualhubs',
    displayName: 'Virtual Hub',
    icon: AZURE_ICONS.vhub,
    width: 65, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== NETWORKING - PRIVATE CONNECTIVITY ====================
  'publicIp': {
    type: 'microsoft.network/publicipaddresses',
    displayName: 'Public IP',
    icon: AZURE_ICONS.publicIp,
    width: 65, height: 52,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'privateEndpoint': {
    type: 'microsoft.network/privateendpoints',
    displayName: 'Private Endpoint',
    icon: AZURE_ICONS.privateEndpoint,
    width: 72, height: 66,
    containedBy: ['subnet'],
    category: 'networking',
  },
  'privateLink': {
    type: 'microsoft.network/privatelinkservices',
    displayName: 'Private Link Service',
    icon: AZURE_ICONS.privateLinkService,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== NETWORKING - DNS ====================
  'dns': {
    type: 'microsoft.network/dnszones',
    displayName: 'DNS Zone',
    icon: AZURE_ICONS.dns,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'privateDns': {
    type: 'microsoft.network/privatednszones',
    displayName: 'Private DNS Zone',
    icon: AZURE_ICONS.privateDns,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== NETWORKING - ROUTING ====================
  'routeTable': {
    type: 'microsoft.network/routetables',
    displayName: 'Route Table',
    icon: AZURE_ICONS.routeTable,
    width: 50, height: 50,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'routeFilter': {
    type: 'microsoft.network/routefilters',
    displayName: 'Route Filter',
    icon: AZURE_ICONS.routeFilter,
    width: 50, height: 50,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== COMPUTE ====================
  'vm': {
    type: 'microsoft.compute/virtualmachines',
    displayName: 'Virtual Machine',
    icon: AZURE_ICONS.vm,
    width: 69, height: 64,
    containedBy: ['subnet', 'resourceGroup', 'availabilityZone'],
    category: 'compute',
  },
  'vmss': {
    type: 'microsoft.compute/virtualmachinescalesets',
    displayName: 'VM Scale Set',
    icon: AZURE_ICONS.vmss,
    width: 68, height: 68,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'compute',
  },
  'availabilitySet': {
    type: 'microsoft.compute/availabilitysets',
    displayName: 'Availability Set',
    icon: AZURE_ICONS.availabilitySet,
    width: 68, height: 68,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'aks': {
    type: 'microsoft.containerservice/managedclusters',
    displayName: 'AKS Cluster',
    icon: AZURE_ICONS.aks,
    width: 68, height: 60,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'compute',
  },
  'containerInstance': {
    type: 'microsoft.containerinstance/containergroups',
    displayName: 'Container Instance',
    icon: AZURE_ICONS.containerInstance,
    width: 64, height: 68,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'compute',
  },
  'containerRegistry': {
    type: 'microsoft.containerregistry/registries',
    displayName: 'Container Registry',
    icon: AZURE_ICONS.containerRegistry,
    width: 60, height: 60,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'containerApp': {
    type: 'microsoft.app/containerapps',
    displayName: 'Container App',
    icon: AZURE_ICONS.containerApp,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'functionApp': {
    type: 'microsoft.web/sites',
    displayName: 'Function App',
    icon: AZURE_ICONS.functionApp,
    width: 68, height: 60,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'appService': {
    type: 'microsoft.web/sites',
    displayName: 'App Service',
    icon: AZURE_ICONS.appService,
    width: 64, height: 64,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'compute',
  },
  'appServicePlan': {
    type: 'microsoft.web/serverfarms',
    displayName: 'App Service Plan',
    icon: AZURE_ICONS.appServicePlan,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'avd': {
    type: 'microsoft.desktopvirtualization/hostpools',
    displayName: 'Azure Virtual Desktop',
    icon: AZURE_ICONS.avd,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },

  // ==================== STORAGE ====================
  'storageAccount': {
    type: 'microsoft.storage/storageaccounts',
    displayName: 'Storage Account',
    icon: AZURE_ICONS.storageAccount,
    width: 65, height: 52,
    containedBy: ['resourceGroup'],
    category: 'storage',
  },
  'dataLake': {
    type: 'microsoft.datalakestore/accounts',
    displayName: 'Data Lake Storage',
    icon: AZURE_ICONS.dataLake,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'storage',
  },
  'netAppFiles': {
    type: 'microsoft.netapp/netappaccounts',
    displayName: 'NetApp Files',
    icon: AZURE_ICONS.netAppFiles,
    width: 65, height: 52,
    containedBy: ['resourceGroup'],
    category: 'storage',
  },

  // ==================== DATABASES ====================
  'cosmosDb': {
    type: 'microsoft.documentdb/databaseaccounts',
    displayName: 'Cosmos DB',
    icon: AZURE_ICONS.cosmosDb,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'sqlServer': {
    type: 'microsoft.sql/servers',
    displayName: 'SQL Server',
    icon: AZURE_ICONS.sqlServer,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'sqlDatabase': {
    type: 'microsoft.sql/servers/databases',
    displayName: 'SQL Database',
    icon: AZURE_ICONS.sqlDatabase,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'sqlManagedInstance': {
    type: 'microsoft.sql/managedinstances',
    displayName: 'SQL Managed Instance',
    icon: AZURE_ICONS.sqlManagedInstance,
    width: 64, height: 64,
    containedBy: ['subnet'],
    category: 'databases',
  },
  'mysql': {
    type: 'microsoft.dbformysql/servers',
    displayName: 'Azure MySQL',
    icon: AZURE_ICONS.mysql,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'postgresql': {
    type: 'microsoft.dbforpostgresql/servers',
    displayName: 'Azure PostgreSQL',
    icon: AZURE_ICONS.postgresql,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'redis': {
    type: 'microsoft.cache/redis',
    displayName: 'Redis Cache',
    icon: AZURE_ICONS.redis,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'dataExplorer': {
    type: 'microsoft.kusto/clusters',
    displayName: 'Data Explorer',
    icon: AZURE_ICONS.dataExplorer,
    width: 68, height: 68,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },

  // ==================== SECURITY ====================
  'keyVault': {
    type: 'microsoft.keyvault/vaults',
    displayName: 'Key Vault',
    icon: AZURE_ICONS.keyVault,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'security',
  },
  'defender': {
    type: 'microsoft.security/pricings',
    displayName: 'Microsoft Defender',
    icon: AZURE_ICONS.defender,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'security',
  },

  // ==================== INTEGRATION ====================
  'apiManagement': {
    type: 'microsoft.apimanagement/service',
    displayName: 'API Management',
    icon: AZURE_ICONS.apiManagement,
    width: 65, height: 60,
    containedBy: ['subnet', 'resourceGroup'],
    category: 'integration',
  },
  'serviceBus': {
    type: 'microsoft.servicebus/namespaces',
    displayName: 'Service Bus',
    icon: AZURE_ICONS.serviceBus,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },
  'eventHub': {
    type: 'microsoft.eventhub/namespaces',
    displayName: 'Event Hub',
    icon: AZURE_ICONS.eventHub,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },
  'eventGrid': {
    type: 'microsoft.eventgrid/topics',
    displayName: 'Event Grid',
    icon: AZURE_ICONS.eventGrid,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },
  'logicApp': {
    type: 'microsoft.logic/workflows',
    displayName: 'Logic App',
    icon: AZURE_ICONS.logicApp,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },
  'appConfig': {
    type: 'microsoft.appconfiguration/configurationstores',
    displayName: 'App Configuration',
    icon: AZURE_ICONS.appConfig,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },

  // ==================== AI/ML ====================
  'openAI': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Azure OpenAI',
    icon: AZURE_ICONS.openAI,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'cognitiveServices': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Cognitive Services',
    icon: AZURE_ICONS.cognitiveServices,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'machineLearning': {
    type: 'microsoft.machinelearningservices/workspaces',
    displayName: 'Machine Learning',
    icon: AZURE_ICONS.machineLearning,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'botService': {
    type: 'microsoft.botservice/botservices',
    displayName: 'Bot Service',
    icon: AZURE_ICONS.botService,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },

  // ==================== ANALYTICS ====================
  'databricks': {
    type: 'microsoft.databricks/workspaces',
    displayName: 'Databricks',
    icon: AZURE_ICONS.databricks,
    width: 60, height: 68,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'synapse': {
    type: 'microsoft.synapse/workspaces',
    displayName: 'Synapse Analytics',
    icon: AZURE_ICONS.synapse,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'purview': {
    type: 'microsoft.purview/accounts',
    displayName: 'Purview',
    icon: AZURE_ICONS.purview,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },

  // ==================== MONITORING ====================
  'appInsights': {
    type: 'microsoft.insights/components',
    displayName: 'Application Insights',
    icon: AZURE_ICONS.appInsights,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'monitoring',
  },
  'grafana': {
    type: 'microsoft.dashboard/grafana',
    displayName: 'Grafana',
    icon: AZURE_ICONS.grafana,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'monitoring',
  },

  // ==================== MANAGEMENT ====================
  'recoveryVault': {
    type: 'microsoft.recoveryservices/vaults',
    displayName: 'Recovery Services Vault',
    icon: AZURE_ICONS.recoveryVault,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'management',
  },
  'automationAccount': {
    type: 'microsoft.automation/automationaccounts',
    displayName: 'Automation Account',
    icon: AZURE_ICONS.automationAccount,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'management',
  },
  'arcMachine': {
    type: 'microsoft.hybridcompute/machines',
    displayName: 'Azure Arc Machine',
    icon: AZURE_ICONS.arcMachine,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'management',
  },

  // ==================== COMPUTE (previously icon-only) ====================
  'disk': {
    type: 'microsoft.compute/disks',
    displayName: 'Managed Disk',
    icon: AZURE_ICONS.disk,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'serviceFabric': {
    type: 'microsoft.servicefabric/clusters',
    displayName: 'Service Fabric',
    icon: AZURE_ICONS.serviceFabric,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'batch': {
    type: 'microsoft.batch/batchaccounts',
    displayName: 'Batch Account',
    icon: AZURE_ICONS.batch,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },
  'containerAppEnv': {
    type: 'microsoft.app/managedenvironments',
    displayName: 'Container App Environment',
    icon: AZURE_ICONS.containerAppEnv,
    width: 64, height: 64,
    isContainer: true,
    containerStyle: CONTAINER_STYLES.resourceGroup,
    containedBy: ['resourceGroup'],
    canContain: ['containerApp'],
    category: 'compute',
  },
  'springApp': {
    type: 'microsoft.appplatform/spring',
    displayName: 'Spring Apps',
    icon: AZURE_ICONS.appService,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'compute',
  },

  // ==================== NETWORKING (previously icon-only) ====================
  'nic': {
    type: 'microsoft.network/networkinterfaces',
    displayName: 'Network Interface',
    icon: AZURE_ICONS.nic,
    width: 64, height: 52,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'publicIpPrefix': {
    type: 'microsoft.network/publicipprefixes',
    displayName: 'Public IP Prefix',
    icon: AZURE_ICONS.publicIpPrefix,
    width: 65, height: 52,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'firewallPolicy': {
    type: 'microsoft.network/firewallpolicies',
    displayName: 'Firewall Policy',
    icon: AZURE_ICONS.firewallPolicy,
    width: 71, height: 60,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'networkWatcher': {
    type: 'microsoft.network/networkwatchers',
    displayName: 'Network Watcher',
    icon: AZURE_ICONS.networkWatcher,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'networkManager': {
    type: 'microsoft.network/networkmanagers',
    displayName: 'Network Manager',
    icon: AZURE_ICONS.networkManager,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'ipGroup': {
    type: 'microsoft.network/ipgroups',
    displayName: 'IP Group',
    icon: AZURE_ICONS.ipGroup,
    width: 50, height: 50,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },
  'serviceEndpoint': {
    type: 'microsoft.network/serviceendpointpolicies',
    displayName: 'Service Endpoint Policy',
    icon: AZURE_ICONS.serviceEndpoint,
    width: 50, height: 50,
    containedBy: ['resourceGroup'],
    category: 'networking',
  },

  // ==================== DATABASES (previously icon-only) ====================
  'sqlElasticPool': {
    type: 'microsoft.sql/servers/elasticpools',
    displayName: 'SQL Elastic Pool',
    icon: AZURE_ICONS.sqlElasticPool,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'sqlVm': {
    type: 'microsoft.sqlvirtualmachine/sqlvirtualmachines',
    displayName: 'SQL VM',
    icon: AZURE_ICONS.sqlVm,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'postgresqlFlex': {
    type: 'microsoft.dbforpostgresql/flexibleservers',
    displayName: 'PostgreSQL Flexible',
    icon: AZURE_ICONS.postgresqlFlex,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'mariadb': {
    type: 'microsoft.dbformariadb/servers',
    displayName: 'Azure MariaDB',
    icon: AZURE_ICONS.mariadb,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },
  'dms': {
    type: 'microsoft.datamigration/services',
    displayName: 'Database Migration Service',
    icon: AZURE_ICONS.dms,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'databases',
  },

  // ==================== SECURITY (new) ====================
  'sentinel': {
    type: 'microsoft.securityinsights/alertrules',
    displayName: 'Microsoft Sentinel',
    icon: AZURE_ICONS.sentinel,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'security',
  },
  'managedIdentity': {
    type: 'microsoft.managedidentity/userassignedidentities',
    displayName: 'Managed Identity',
    icon: AZURE_ICONS.managedIdentity,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'identity',
  },

  // ==================== INTEGRATION (previously icon-only) ====================
  'integrationAccount': {
    type: 'microsoft.logic/integrationaccounts',
    displayName: 'Integration Account',
    icon: AZURE_ICONS.integrationAccount,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },
  'relay': {
    type: 'microsoft.relay/namespaces',
    displayName: 'Azure Relay',
    icon: AZURE_ICONS.relay,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },
  'signalR': {
    type: 'microsoft.signalrservice/signalr',
    displayName: 'SignalR Service',
    icon: AZURE_ICONS.signalR,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'integration',
  },

  // ==================== AI/ML (new) ====================
  'aiSearch': {
    type: 'microsoft.search/searchservices',
    displayName: 'Azure AI Search',
    icon: AZURE_ICONS.aiSearch,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'aiFoundry': {
    type: 'microsoft.machinelearningservices/workspaces',
    displayName: 'Azure AI Foundry',
    icon: AZURE_ICONS.aiFoundry,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'documentIntelligence': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Document Intelligence',
    icon: AZURE_ICONS.documentIntelligence,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'speechService': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Speech Service',
    icon: AZURE_ICONS.speechService,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'computerVision': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Computer Vision',
    icon: AZURE_ICONS.computerVision,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'languageService': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Language Service',
    icon: AZURE_ICONS.languageService,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },
  'contentSafety': {
    type: 'microsoft.cognitiveservices/accounts',
    displayName: 'Content Safety',
    icon: AZURE_ICONS.contentSafety,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'ai',
  },

  // ==================== ANALYTICS (new) ====================
  'dataFactory': {
    type: 'microsoft.datafactory/factories',
    displayName: 'Data Factory',
    icon: AZURE_ICONS.dataFactory,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'streamAnalytics': {
    type: 'microsoft.streamanalytics/streamingjobs',
    displayName: 'Stream Analytics',
    icon: AZURE_ICONS.streamAnalytics,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'hdInsight': {
    type: 'microsoft.hdinsight/clusters',
    displayName: 'HDInsight',
    icon: AZURE_ICONS.hdInsight,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'analysisServices': {
    type: 'microsoft.analysisservices/servers',
    displayName: 'Analysis Services',
    icon: AZURE_ICONS.analysisServices,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'powerBiEmbedded': {
    type: 'microsoft.powerbidedicated/capacities',
    displayName: 'Power BI Embedded',
    icon: AZURE_ICONS.powerBiEmbedded,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },
  'fabric': {
    type: 'microsoft.fabric/capacities',
    displayName: 'Microsoft Fabric',
    icon: AZURE_ICONS.fabric,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'analytics',
  },

  // ==================== MONITORING (new) ====================
  'logAnalytics': {
    type: 'microsoft.operationalinsights/workspaces',
    displayName: 'Log Analytics',
    icon: AZURE_ICONS.logAnalytics,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'monitoring',
  },
  'monitor': {
    type: 'microsoft.monitor/accounts',
    displayName: 'Azure Monitor',
    icon: AZURE_ICONS.monitor,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'monitoring',
  },
  'actionGroup': {
    type: 'microsoft.insights/actiongroups',
    displayName: 'Action Group',
    icon: AZURE_ICONS.actionGroup,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'monitoring',
  },

  // ==================== IDENTITY (new) ====================
  'azureAd': {
    type: 'microsoft.aad/domainservices',
    displayName: 'Entra ID',
    icon: AZURE_ICONS.azureAd,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'identity',
  },

  // ==================== IoT (new) ====================
  'iotHub': {
    type: 'microsoft.devices/iothubs',
    displayName: 'IoT Hub',
    icon: AZURE_ICONS.iotHub,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'iot',
  },
  'iotCentral': {
    type: 'microsoft.iotcentral/iotapps',
    displayName: 'IoT Central',
    icon: AZURE_ICONS.iotCentral,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'iot',
  },
  'digitalTwins': {
    type: 'microsoft.digitaltwins/digitaltwinsinstances',
    displayName: 'Digital Twins',
    icon: AZURE_ICONS.digitalTwins,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'iot',
  },

  // ==================== DevOps (new) ====================
  'devops': {
    type: 'microsoft.devops/pipelines',
    displayName: 'Azure DevOps',
    icon: AZURE_ICONS.devops,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'devops',
  },

  // ==================== WEB (new) ====================
  'staticWebApp': {
    type: 'microsoft.web/staticsites',
    displayName: 'Static Web App',
    icon: AZURE_ICONS.staticWebApp,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'web',
  },
  'notificationHub': {
    type: 'microsoft.notificationhubs/namespaces',
    displayName: 'Notification Hub',
    icon: AZURE_ICONS.notificationHub,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'web',
  },
  'communicationService': {
    type: 'microsoft.communication/communicationservices',
    displayName: 'Communication Services',
    icon: AZURE_ICONS.communicationService,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'web',
  },

  // ==================== MANAGEMENT (new) ====================
  'policy': {
    type: 'microsoft.authorization/policydefinitions',
    displayName: 'Azure Policy',
    icon: AZURE_ICONS.policy,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'management',
  },
  'advisor': {
    type: 'microsoft.advisor/recommendations',
    displayName: 'Azure Advisor',
    icon: AZURE_ICONS.advisor,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'management',
  },
  'backupCenter': {
    type: 'microsoft.dataprotection/backupvaults',
    displayName: 'Backup Center',
    icon: AZURE_ICONS.backupCenter,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'management',
  },
  'migrate': {
    type: 'microsoft.migrate/migrateprojects',
    displayName: 'Azure Migrate',
    icon: AZURE_ICONS.migrate,
    width: 64, height: 64,
    containedBy: ['resourceGroup'],
    category: 'migration',
  },
};

// ==================== ALIASES ====================
export const RESOURCE_ALIASES: Record<string, string> = {
  // Compute
  'virtual machine': 'vm', 'virtual machines': 'vm', 'vms': 'vm',
  'scale set': 'vmss', 'scaleset': 'vmss', 'vm scale set': 'vmss',
  'kubernetes': 'aks', 'k8s': 'aks',
  'container': 'containerInstance', 'containers': 'containerInstance', 'aci': 'containerInstance',
  'container app': 'containerApp', 'containerapps': 'containerApp', 'aca': 'containerApp',
  'container app environment': 'containerAppEnv', 'aca environment': 'containerAppEnv',
  'acr': 'containerRegistry', 'registry': 'containerRegistry',
  'function': 'functionApp', 'functions': 'functionApp', 'azure function': 'functionApp',
  'web app': 'appService', 'webapp': 'appService', 'app': 'appService',
  'virtual desktop': 'avd', 'wvd': 'avd',
  'managed disk': 'disk', 'disks': 'disk',
  'service fabric': 'serviceFabric',
  'batch account': 'batch', 'azure batch': 'batch',
  'app service plan': 'appServicePlan', 'asp': 'appServicePlan',
  'spring apps': 'springApp', 'spring cloud': 'springApp',
  
  // Networking
  'virtual network': 'vnet', 'virtual networks': 'vnet', 'vnets': 'vnet',
  'hub vnet': 'hubVnet', 'hub network': 'hubVnet', 'hub': 'hubVnet',
  'spoke vnet': 'vnet', 'spoke': 'vnet', 'spoke network': 'vnet',
  'nsg': 'nsg', 'security group': 'nsg',
  'asg': 'asg', 'application security group': 'asg',
  'lb': 'loadBalancer', 'load balancer': 'loadBalancer', 'slb': 'loadBalancer',
  'agw': 'appGateway', 'application gateway': 'appGateway', 'app gateway': 'appGateway',
  'fw': 'firewall', 'azure firewall': 'firewall', 'azfw': 'firewall',
  'firewall policy': 'firewallPolicy',
  'afd': 'frontDoor', 'front door': 'frontDoor', 'frontdoor': 'frontDoor',
  'tm': 'trafficManager', 'traffic manager': 'trafficManager',
  'vpn': 'vpnGateway', 'vpn gateway': 'vpnGateway', 'vng': 'vpnGateway',
  'er': 'expressRoute', 'expressroute': 'expressRoute', 'express route': 'expressRoute',
  'erd': 'expressRouteDirect', 'expressroute direct': 'expressRouteDirect',
  'vwan': 'vwan', 'virtual wan': 'vwan', 'virtualwan': 'vwan',
  'virtual hub': 'vhub', 'vhub': 'vhub',
  'private endpoint': 'privateEndpoint', 'pe': 'privateEndpoint', 'pep': 'privateEndpoint',
  'private link': 'privateLink', 'pls': 'privateLink',
  'public ip': 'publicIp', 'pip': 'publicIp',
  'public ip prefix': 'publicIpPrefix',
  'nat gateway': 'nat', 'natgw': 'nat',
  'ddos': 'ddosProtection', 'ddos protection': 'ddosProtection',
  'udr': 'routeTable', 'route table': 'routeTable',
  'network watcher': 'networkWatcher',
  'network manager': 'networkManager',
  'on-premises': 'onPremises', 'onprem': 'onPremises', 'on premises': 'onPremises', 'datacenter': 'onPremises',
  'local gateway': 'localNetworkGateway', 'lgw': 'localNetworkGateway',
  'connection': 'connection', 'conn': 'connection',
  'waf': 'waf', 'web application firewall': 'waf',
  'nic': 'nic', 'network interface': 'nic',

  // Storage
  'storage': 'storageAccount', 'storage account': 'storageAccount', 'blob': 'storageAccount',
  'data lake': 'dataLake', 'adls': 'dataLake',
  'netapp': 'netAppFiles', 'anf': 'netAppFiles',

  // Databases
  'cosmos': 'cosmosDb', 'cosmosdb': 'cosmosDb', 'cosmos db': 'cosmosDb',
  'sql': 'sqlDatabase', 'azure sql': 'sqlDatabase', 'sql db': 'sqlDatabase',
  'sql server': 'sqlServer', 'logical server': 'sqlServer',
  'sql mi': 'sqlManagedInstance', 'managed instance': 'sqlManagedInstance',
  'sql elastic pool': 'sqlElasticPool', 'elastic pool': 'sqlElasticPool',
  'sql vm': 'sqlVm', 'sql on vm': 'sqlVm',
  'mysql': 'mysql', 'azure mysql': 'mysql',
  'postgres': 'postgresql', 'postgresql': 'postgresql', 'azure postgres': 'postgresql',
  'postgres flexible': 'postgresqlFlex', 'postgresql flexible': 'postgresqlFlex',
  'mariadb': 'mariadb', 'maria db': 'mariadb',
  'cache': 'redis', 'redis': 'redis', 'redis cache': 'redis',
  'kusto': 'dataExplorer', 'adx': 'dataExplorer', 'data explorer': 'dataExplorer',
  'database migration': 'dms', 'dms': 'dms',

  // Security
  'keyvault': 'keyVault', 'key vault': 'keyVault', 'kv': 'keyVault', 'akv': 'keyVault',
  'defender': 'defender', 'mdc': 'defender', 'microsoft defender': 'defender',
  'sentinel': 'sentinel', 'microsoft sentinel': 'sentinel', 'siem': 'sentinel',
  'managed identity': 'managedIdentity', 'msi': 'managedIdentity', 'uami': 'managedIdentity',

  // Integration
  'apim': 'apiManagement', 'api management': 'apiManagement', 'api gateway': 'apiManagement',
  'service bus': 'serviceBus', 'sb': 'serviceBus', 'asb': 'serviceBus',
  'event hub': 'eventHub', 'eventhub': 'eventHub', 'eh': 'eventHub',
  'event grid': 'eventGrid', 'eventgrid': 'eventGrid',
  'logic app': 'logicApp', 'logicapp': 'logicApp',
  'app config': 'appConfig', 'app configuration': 'appConfig',
  'integration account': 'integrationAccount',
  'relay': 'relay', 'azure relay': 'relay',
  'signalr': 'signalR', 'signal r': 'signalR', 'azure signalr': 'signalR',

  // AI
  'openai': 'openAI', 'azure openai': 'openAI', 'aoai': 'openAI', 'gpt': 'openAI',
  'cognitive': 'cognitiveServices', 'cognitive services': 'cognitiveServices',
  'ml': 'machineLearning', 'machine learning': 'machineLearning', 'aml': 'machineLearning',
  'bot': 'botService', 'bot service': 'botService',
  'ai search': 'aiSearch', 'cognitive search': 'aiSearch', 'search service': 'aiSearch',
  'ai foundry': 'aiFoundry', 'azure ai foundry': 'aiFoundry',
  'document intelligence': 'documentIntelligence', 'form recognizer': 'documentIntelligence',
  'speech': 'speechService', 'speech service': 'speechService',
  'computer vision': 'computerVision', 'vision': 'computerVision',
  'language service': 'languageService', 'text analytics': 'languageService', 'luis': 'languageService',
  'content safety': 'contentSafety',

  // Analytics
  'databricks': 'databricks', 'adb': 'databricks',
  'synapse': 'synapse', 'synapse analytics': 'synapse',
  'data factory': 'dataFactory', 'adf': 'dataFactory',
  'stream analytics': 'streamAnalytics', 'asa': 'streamAnalytics',
  'hdinsight': 'hdInsight', 'hdi': 'hdInsight',
  'analysis services': 'analysisServices',
  'power bi': 'powerBiEmbedded', 'power bi embedded': 'powerBiEmbedded',
  'purview': 'purview', 'microsoft purview': 'purview',
  'fabric': 'fabric', 'microsoft fabric': 'fabric', 'azure fabric': 'fabric',

  // Monitoring
  'app insights': 'appInsights', 'appinsights': 'appInsights',
  'log analytics': 'logAnalytics', 'log analytics workspace': 'logAnalytics', 'law': 'logAnalytics',
  'grafana': 'grafana', 'amg': 'grafana',
  'monitor': 'monitor', 'azure monitor': 'monitor',
  'action group': 'actionGroup',

  // Identity
  'azure ad': 'azureAd', 'entra id': 'azureAd', 'entra': 'azureAd', 'aad': 'azureAd',

  // IoT
  'iot hub': 'iotHub', 'iot': 'iotHub',
  'iot central': 'iotCentral',
  'digital twins': 'digitalTwins',

  // DevOps
  'devops': 'devops', 'azure devops': 'devops', 'ado': 'devops',

  // Web
  'static web app': 'staticWebApp', 'swa': 'staticWebApp', 'static site': 'staticWebApp',
  'notification hub': 'notificationHub',
  'communication services': 'communicationService', 'acs': 'communicationService',

  // Management
  'backup vault': 'recoveryVault', 'rsv': 'recoveryVault', 'asrv': 'recoveryVault',
  'automation': 'automationAccount',
  'arc': 'arcMachine', 'azure arc': 'arcMachine',
  'backup center': 'backupCenter',
  'policy': 'policy', 'azure policy': 'policy',
  'advisor': 'advisor', 'azure advisor': 'advisor',
  'migrate': 'migrate', 'azure migrate': 'migrate',

  // Regions
  'region': 'region', 'azure region': 'region',
  'zone': 'availabilityZone', 'az': 'availabilityZone', 'availability zone': 'availabilityZone',
};

export function resolveResourceType(input: string): string | undefined {
  const normalized = input.toLowerCase().trim();
  if (RESOURCES[normalized]) return normalized;
  if (RESOURCE_ALIASES[normalized]) return RESOURCE_ALIASES[normalized];
  return undefined;
}

export function getResourcesByCategory(category: ResourceCategory): ResourceDefinition[] {
  return Object.values(RESOURCES).filter(r => r.category === category);
}

export function listAllResources(): string[] {
  return Object.keys(RESOURCES);
}

export function listAllAliases(): Record<string, string> {
  return { ...RESOURCE_ALIASES };
}
