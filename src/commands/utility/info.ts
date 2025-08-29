import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, Client } from "discord.js";
import type { ColorResolvable } from "discord.js";
import { readFileSync } from "fs";
import { join } from "path";
import { performance } from "perf_hooks";

interface LatencyStatus {
    status: string;
    color: ColorResolvable;
}

interface PingMetrics {
    roundTripLatency: number;
    websocketLatency: number;
    uptime: string;
    apiLatency: number;
}

function getLatencyStatus(latency: number): LatencyStatus {
    if (latency < 100) {
        return { status: "🟢 Excellent", color: 0x00ff00 };
    } else if (latency < 200) {
        return { status: "🟡 Good", color: 0xffff00 };
    } else if (latency < 500) {
        return { status: "🟠 Fair", color: 0xffa500 };
    } else {
        return { status: "🔴 Poor", color: 0xff0000 };
    }
}

function formatUptime(uptime: number): string {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

async function getPingMetrics(client: Client, interaction: ChatInputCommandInteraction): Promise<PingMetrics> {
    const startTime = performance.now();
    await interaction.deferReply();
    const endTime = performance.now();
    
    return {
        roundTripLatency: Math.round(endTime - startTime),
        websocketLatency: client.ws.ping,
        apiLatency: Math.round(endTime - startTime),
        uptime: formatUptime(process.uptime())
    };
}

function getVersionInfo(): { botVersion: string; nodeVersion: string; discordVersion: string } {
    try {
        const packagePath = join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        
        return {
            botVersion: packageJson.version || "Unknown",
            nodeVersion: process.version,
            discordVersion: packageJson.dependencies?.['discord.js'] || "Unknown"
        };
    } catch (error) {
        return {
            botVersion: "Unknown",
            nodeVersion: process.version,
            discordVersion: "Unknown"
        };
    }
}

const data = new SlashCommandBuilder()
    .setName("info")
    .setDescription("Display comprehensive bot information including metrics and status");

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.client;
    
    const pingMetrics = await getPingMetrics(client, interaction);
    const versionInfo = getVersionInfo();
    
    const wsStatus = getLatencyStatus(pingMetrics.websocketLatency);
    const apiStatus = getLatencyStatus(pingMetrics.apiLatency);
    
    const embed = new EmbedBuilder()
        .setTitle("📋 ClientConcierge • System Status")
        .setDescription("*Bot metrics and system information*")
        .setColor(wsStatus.color)
        .setTimestamp()
        .setFooter({ 
            text: `Requested by ${interaction.user.username} • v${versionInfo.botVersion}`, 
            iconURL: interaction.user.displayAvatarURL() 
        })
        .addFields(
            {
                name: "🌐 Network Status",
                value: [
                    `**WebSocket** ${wsStatus.status}`,
                    `└ \`${pingMetrics.websocketLatency}ms\``,
                    `**API Response** ${apiStatus.status}`,
                    `└ \`${pingMetrics.apiLatency}ms\``
                ].join('\n'),
                inline: true
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: "💾 Memory Usage",
                value: [
                    `**Heap Used**`, 
                    `└ \`${formatBytes(process.memoryUsage().heapUsed)}\``,
                    `**Heap Total**`, 
                    `└ \`${formatBytes(process.memoryUsage().heapTotal)}\``,
                    `**RSS**`, 
                    `└ \`${formatBytes(process.memoryUsage().rss)}\``
                ].join('\n'),
                inline: true
            },
            { name: '\u200B', value: '\u200B', inline: false },
            {
                name: "⚡ System Performance",
                value: [
                    `**Uptime**`, 
                    `└ \`${pingMetrics.uptime}\``,
                    `**CPU User**`, 
                    `└ \`${Math.round(process.cpuUsage().user / 1000)}ms\``,
                    `**CPU System**`, 
                    `└ \`${Math.round(process.cpuUsage().system / 1000)}ms\``,
                    `**Round Trip**`, 
                    `└ \`${pingMetrics.roundTripLatency}ms\``
                ].join('\n'),
                inline: true
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: "🔧 Environment",
                value: [
                    `**Node.js**`, 
                    `└ \`${versionInfo.nodeVersion}\``,
                    `**Discord.js**`, 
                    `└ \`${versionInfo.discordVersion}\``,
                    `**Platform**`, 
                    `└ \`${process.platform}\``,
                    `**Architecture**`, 
                    `└ \`${process.arch}\``
                ].join('\n'),
                inline: true
            }
        );

    if (client.user?.displayAvatarURL()) {
        embed.setThumbnail(client.user.displayAvatarURL());
    }

    await interaction.editReply({ embeds: [embed] });
}

export default { data, execute };