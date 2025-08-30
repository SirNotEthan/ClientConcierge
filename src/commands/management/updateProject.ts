import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder,
    User
} from "discord.js";
import { ProjectStatus } from '../../types/project.js';
import { PROJECT_COLORS, PROJECT_EMOJIS } from '../../constants/project.js';

export const data = new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update project stage and progress %. Sends DM to client with update.')
    .addUserOption(option =>
        option.setName('client')
            .setDescription('The client to update')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('stage')
            .setDescription('Current project stage/status')
            .setRequired(true)
            .addChoices(
                { name: 'Pending', value: ProjectStatus.PENDING },
                { name: 'In Progress', value: ProjectStatus.IN_PROGRESS },
                { name: 'Completed', value: ProjectStatus.COMPLETED },
                { name: 'On Hold', value: ProjectStatus.ON_HOLD },
                { name: 'Cancelled', value: ProjectStatus.CANCELLED }
            )
    )
    .addIntegerOption(option =>
        option.setName('progress')
            .setDescription('Progress percentage (0-100)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100)
    )
    .addStringOption(option =>
        option.setName('message')
            .setDescription('Additional update message for the client (optional)')
            .setRequired(false)
            .setMaxLength(1000)
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.options.getUser('client', true);
    const stage = interaction.options.getString('stage', true) as ProjectStatus;
    const progress = interaction.options.getInteger('progress', true);
    const message = interaction.options.getString('message');

    try {
        // Create update embed for the server (public response)
        const publicEmbed = new EmbedBuilder()
            .setTitle(`${PROJECT_EMOJIS.INFO} Project Update`)
            .setDescription(`Project update has been sent to ${client}`)
            .addFields(
                { 
                    name: `${PROJECT_EMOJIS.CLIENT} Client`, 
                    value: `${client.tag}`, 
                    inline: true 
                },
                { 
                    name: `${PROJECT_EMOJIS.INFO} Stage`, 
                    value: stage, 
                    inline: true 
                },
                { 
                    name: '📊 Progress', 
                    value: `${progress}%`, 
                    inline: true 
                }
            )
            .setColor(getStatusColor(stage) as any)
            .setTimestamp()
            .setFooter({ 
                text: `Updated by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setThumbnail(client.displayAvatarURL());

        if (message) {
            publicEmbed.addFields({
                name: `${PROJECT_EMOJIS.NOTES} Update Message`,
                value: message
            });
        }

        // Reply publicly first
        await interaction.reply({ 
            embeds: [publicEmbed] 
        });

        // Create DM embed for the client
        const dmEmbed = new EmbedBuilder()
            .setTitle(`${PROJECT_EMOJIS.INFO} Project Update`)
            .setDescription(`Hello ${client}! Here's an update on your project:`)
            .addFields(
                { 
                    name: '📊 Current Progress', 
                    value: `${progress}%`, 
                    inline: true 
                },
                { 
                    name: `${PROJECT_EMOJIS.INFO} Project Stage`, 
                    value: stage, 
                    inline: true 
                },
                {
                    name: '📅 Updated',
                    value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                    inline: true
                }
            )
            .setColor(getStatusColor(stage) as any)
            .setTimestamp()
            .setThumbnail(interaction.user.displayAvatarURL());

        // Add footer if guild exists
        if (interaction.guild?.name) {
            const guildIcon = interaction.guild.iconURL();
            dmEmbed.setFooter({ 
                text: `Update from ${interaction.guild.name}`,
                ...(guildIcon && { iconURL: guildIcon })
            });
        }

        if (message) {
            dmEmbed.addFields({
                name: `${PROJECT_EMOJIS.NOTES} Message from ${interaction.user.displayName}`,
                value: message
            });
        }

        // Add progress bar visualization
        const progressBar = createProgressBar(progress);
        dmEmbed.addFields({
            name: '📈 Progress Visualization',
            value: `\`${progressBar}\` ${progress}%`,
            inline: false
        });

        // Send DM to client
        try {
            await client.send({ embeds: [dmEmbed] });
            
            // Log successful DM
            console.log(`${PROJECT_EMOJIS.SUCCESS} Project update DM sent successfully:`);
            console.log(`  - Updated by: ${interaction.user.tag} (${interaction.user.id})`);
            console.log(`  - Client: ${client.tag} (${client.id})`);
            console.log(`  - Stage: ${stage}`);
            console.log(`  - Progress: ${progress}%`);
            console.log(`  - Message: ${message || 'None'}`);
            
        } catch (dmError) {
            console.error('Failed to send DM to client:', dmError);
            
            // Send ephemeral follow-up about DM failure
            const dmFailureEmbed = new EmbedBuilder()
                .setTitle(`${PROJECT_EMOJIS.WARNING} DM Delivery Issue`)
                .setDescription(`The update was posted here, but I couldn't send a DM to ${client}.`)
                .addFields({
                    name: 'Possible reasons',
                    value: '• Client has DMs disabled\n• Client has blocked the bot\n• Client is not in a mutual server',
                    inline: false
                })
                .setColor(PROJECT_COLORS.WARNING)
                .setTimestamp();

            await interaction.followUp({
                embeds: [dmFailureEmbed],
                ephemeral: true
            });
        }

    } catch (error) {
        console.error('Error in update command:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setTitle(`${PROJECT_EMOJIS.ERROR} Update Failed`)
            .setDescription('An unexpected error occurred while sending the project update.')
            .addFields({
                name: 'What to do next',
                value: '• Please try running the command again\n• If the problem persists, contact support'
            })
            .setColor(PROJECT_COLORS.ERROR)
            .setTimestamp();

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                embeds: [errorEmbed],
                ephemeral: true
            });
        } else {
            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    }
}

function getStatusColor(status: ProjectStatus): string {
    switch (status) {
        case ProjectStatus.PENDING:
            return PROJECT_COLORS.PENDING;
        case ProjectStatus.IN_PROGRESS:
            return PROJECT_COLORS.INFO;
        case ProjectStatus.COMPLETED:
            return PROJECT_COLORS.SUCCESS;
        case ProjectStatus.ON_HOLD:
            return PROJECT_COLORS.WARNING;
        case ProjectStatus.CANCELLED:
            return PROJECT_COLORS.ERROR;
        default:
            return PROJECT_COLORS.INFO;
    }
}

function createProgressBar(progress: number): string {
    const totalBars = 20;
    const filledBars = Math.round((progress / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
}