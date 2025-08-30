import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    User
} from "discord.js";
import type { ProjectFormData } from '../../types/project.js';
import { PROJECT_CONFIG, PROJECT_COLORS, PROJECT_EMOJIS, CUSTOM_IDS } from '../../constants/project.js';

export const data = new SlashCommandBuilder()
    .setName('newproject')
    .setDescription('Create a new project manually for a client')
    .addUserOption(option =>
        option.setName('client')
            .setDescription('The client to add')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.options.getUser('client', true);
    
    // Send initial embed saying "Hello @client, You are being added"
    const initialEmbed = new EmbedBuilder()
        .setTitle(`${PROJECT_EMOJIS.CREATE} New Project Creation`)
        .setDescription(`Hello ${client}! 👋\n\nYou've been selected for a new project collaboration. Please help us get started by providing the project details below.\n\n**What happens next:**\n${PROJECT_EMOJIS.FORM} Fill out project details via the button below\n${PROJECT_EMOJIS.INFO} Review and confirm project information\n${PROJECT_EMOJIS.SUCCESS} Project gets created and tracked`)
        .addFields(
            { 
                name: `${PROJECT_EMOJIS.INFO} What You'll Need to Provide`, 
                value: `• Project description and requirements\n• Payment amount and type\n• Any additional notes or considerations`,
                inline: false 
            },
            { 
                name: `${PROJECT_EMOJIS.CLIENT} Client Information`, 
                value: `${client.tag}\nID: \`${client.id}\``, 
                inline: true 
            },
            {
                name: `${PROJECT_EMOJIS.FORM} Estimated Time`,
                value: "⏱️ Takes about 2-3 minutes to complete",
                inline: true
            }
        )
        .setColor(PROJECT_COLORS.INFO)
        .setTimestamp()
        .setFooter({ 
            text: `Initiated by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setThumbnail(client.displayAvatarURL());

    await interaction.reply({ 
        embeds: [initialEmbed] 
    });

    // Create a button to trigger the modal (since modals can only be triggered by button interactions)
    const button = new ButtonBuilder()
        .setCustomId(`${CUSTOM_IDS.NEW_PROJECT_BUTTON}_${client.id}`)
        .setLabel('Fill Project Information')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(PROJECT_EMOJIS.FORM);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    // Send ephemeral follow-up with button to open modal
    await interaction.followUp({
        content: `${PROJECT_EMOJIS.INFO} Click the button below to fill out the project information:`,
        components: [buttonRow],
        ephemeral: true
    });
}

// Export the modal for use in interaction handler  
export function createProjectModal(clientId: string): ModalBuilder {
    const modal = new ModalBuilder()
        .setCustomId(`${CUSTOM_IDS.NEW_PROJECT_MODAL}_${clientId}`)
        .setTitle(`${PROJECT_EMOJIS.FORM} Project Information`);

    const descriptionInput = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.PROJECT_DESCRIPTION_INPUT)
        .setLabel(`${PROJECT_EMOJIS.DESCRIPTION} Project Description`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter a detailed description of the project requirements...')
        .setRequired(true)
        .setMaxLength(PROJECT_CONFIG.maxDescriptionLength);

    const paymentInput = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.PROJECT_PAYMENT_INPUT)
        .setLabel(`${PROJECT_EMOJIS.PAYMENT} Payment Amount`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., $500, 0.1 BTC, €300, etc.')
        .setRequired(true)
        .setMaxLength(PROJECT_CONFIG.maxPaymentLength);

    const paymentTypeInput = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.PROJECT_PAYMENT_TYPE_INPUT)
        .setLabel(`${PROJECT_EMOJIS.PAYMENT_TYPE} Payment Type`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., USD, BTC, ETH, Hourly, Fixed, etc.')
        .setRequired(true)
        .setMaxLength(PROJECT_CONFIG.maxPaymentTypeLength);

    const clientNotesInput = new TextInputBuilder()
        .setCustomId(CUSTOM_IDS.PROJECT_CLIENT_NOTES_INPUT)
        .setLabel(`${PROJECT_EMOJIS.NOTES} Additional Notes (Optional)`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Any additional notes, requirements, or special considerations...')
        .setRequired(false)
        .setMaxLength(PROJECT_CONFIG.maxClientNotesLength);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(paymentInput);
    const thirdActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(paymentTypeInput);
    const fourthActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(clientNotesInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
    
    return modal;
};