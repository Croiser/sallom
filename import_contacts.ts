import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const contacts = [
    { name: "Bruno Lopes", phone: "4598166973" },
    { name: "Rosa Kozievith", phone: "4584219317" },
    { name: "Rozi Kozievith", phone: "4599373090" },
    { name: "Janete Profa", phone: "4598159153" },
    { name: "Maria Macarrão", phone: "4591358404" },
    { name: "Paty BB", phone: "4598180865" },
    { name: "Natália Rucco", phone: "4588292939" },
    { name: "Rafaela", phone: "4588151735" },
    { name: "Tatão", phone: "4598201468" },
    { name: "Ana Paula", phone: "4599367466" },
    { name: "Luciana", phone: "4599716816" },
    { name: "Kelma", phone: "4599579400" },
    { name: "Luana", phone: "4598572980" },
    { name: "Ana.S", phone: "4591521694" },
    { name: "Mara", phone: "4598180030" },
    { name: "Clarisse", phone: "4598173306" },
    { name: "Carine", phone: "4599574371" },
    { name: "Angélika", phone: "4598158152" },
    { name: "Angélica B.", phone: "4588067625" },
    { name: "Angélica Selo", phone: "4599697555" },
    { name: "Beth Selo", phone: "4599427963" },
    { name: "Zelinda", phone: "4599819205" },
    { name: "Jéssica Reus", phone: "4598048749" },
    { name: "Keila", phone: "4591533554" },
    { name: "Eliane Lava", phone: "4591389414" },
    { name: "Simone Gris", phone: "4599670282" },
    { name: "Simoninha", phone: "4599904710" },
    { name: "Erika", phone: "4591590320" },
    { name: "Idete / Odete", phone: "4599256468" },
    { name: "Leila", phone: "4599424119" },
    { name: "Lizi", phone: "4598027771" },
    { name: "Cida", phone: "4599281622" },
    { name: "Elioni Pastorini", phone: "4591383823" },
    { name: "Mary", phone: "4599000559" },
    { name: "Mary Lopes", phone: "4591054501" },
    { name: "Renata", phone: "4599278248" },
    { name: "Jamila", phone: "4599431955" },
    { name: "Ere", phone: "4598551962" },
    { name: "Thais Barros", phone: "4599052490" },
    { name: "Meri", phone: "4598235988" },
    { name: "Mara / Ewerton", phone: "4599969666" },
    { name: "D. Lídia", phone: "4598109977" },
    { name: "Gabriela Custódio", phone: "4599839330" },
    { name: "Gabriela Wisch", phone: "4591228210" },
    { name: "Giliane", phone: "4598076959" },
    { name: "Ellen", phone: "4591129052" },
    { name: "Cleusa", phone: "4591265939" },
    { name: "Ana Cristina", phone: "4599566918" },
    { name: "Ana Luiza", phone: "4599793750" },
    { name: "Leonira", phone: "4599887012" },
    { name: "Sara / Lara Mariano", phone: "4599484083" },
    { name: "Andressa Tavares", phone: "4598291473" },
    { name: "Iva Alban", phone: "4599071046" },
    { name: "Leidi", phone: "4598018610" },
    { name: "Josi Amaral", phone: "4599045884" },
    { name: "Josinha", phone: "4599505129" },
    { name: "Ivonete", phone: "4588036353" },
    { name: "Hosana", phone: "4599760842" },
    { name: "Lilian Sthall", phone: "4591143553" },
    { name: "Sthefany", phone: "4599518858" },
    { name: "Maurícia", phone: "4599310153" },
    { name: "Silvana Farmácia", phone: "4598177547" },
    { name: "Claúdia", phone: "4599514412" },
    { name: "Izabel Mezzomo", phone: "4591341997" },
    { name: "Lia Kirsten", phone: "4599873998" },
    { name: "Juliana Paz", phone: "4598021008" },
    { name: "Rose Costa", phone: "4599937809" },
    { name: "Veraci", phone: "4599941129" },
    { name: "Silvani Baseggio (sil)", phone: "4598450035" },
    { name: "Antônia", phone: "4598521380" },
    { name: "Jéssica", phone: "4598188047" },
    { name: "Faby", phone: "4591351202" },
    { name: "Laurita", phone: "4599797731" },
    { name: "Rose Vizinha", phone: "4599433244" },
    { name: "Rose Vieira", phone: "4599196434" },
    { name: "Maria Eduarda - Vanina", phone: "4591083470" },
    { name: "Fernanda Bueno", phone: "4598046260" },
    { name: "Tai", phone: "4598327679" },
    { name: "Sinara", phone: "4598041705" },
    { name: "Vanessa Bonatto", phone: "4588116378" },
    { name: "Neuza", phone: "4591538876" },
    { name: "Nilda Miguel", phone: "4599835001" },
    { name: "Poliana", phone: "4599235690" },
    { name: "Dani (menino)", phone: "4599120698" },
    { name: "Isaura (Sheila grego)", phone: "6993899080" },
    { name: "Andreia Nandi", phone: "4599294644" },
    { name: "Inês", phone: "4598251741" },
    { name: "Sol", phone: "4584050818" },
    { name: "Zelinda", phone: "4599819205" },
    { name: "Paula", phone: "4598449683" },
    { name: "Eve", phone: "4599191317" },
    { name: "Rose Gomes", phone: "4599835764" },
    { name: "Jéssica Gomes", phone: "4599525880" },
    { name: "Evanir", phone: "4588048887" },
    { name: "Nadir Reis", phone: "4187385534" },
    { name: "Maria Roma", phone: "4599050636" },
    { name: "Jaque Rucco", phone: "4599778637" },
    { name: "Mayara", phone: "45988083974" },
    { name: "Marileine", phone: "4599407210" },
    { name: "Marilene Onório", phone: "4598418705" },
    { name: "Grazi", phone: "4598105299" },
    { name: "Luiza Lorena", phone: "4599930581" },
    { name: "Silvia Renata Rigue", phone: "4591247800" },
    { name: "Tiffany", phone: "4599978564" },
    { name: "Dielsa", phone: "4591189407" },
    { name: "Cris Sente", phone: "4598594817" },
    { name: "Susete", phone: "4599269660" },
    { name: "Letícia Locatelli", phone: "4598200710" },
    { name: "Jaysa", phone: "4591213089" },
    { name: "Vivi Xeque", phone: "4591330796" },
    { name: "Olga", phone: "4598103875" },
    { name: "Suzana", phone: "4591225595" },
    { name: "Eva", phone: "4599514946" },
    { name: "Regiane", phone: "4591400343" },
    { name: "Gabizinha", phone: "4591463891" },
    { name: "Nami", phone: "4599078399" },
    { name: "Luana", phone: "4598572980" },
    { name: "Michele Oliveira", phone: "4591542158" },
    { name: "Crislaine", phone: "4599157205" },
    { name: "Lúcia", phone: "4599544651" },
    { name: "Silvana Ramão", phone: "4599375903" },
    { name: "Amanda Chácara", phone: "4599225256" }
];

async function main() {
    const email = "lucyr8585@gmail.com";
    
    console.log(`Buscando proprietário com o e-mail: ${email}...`);
    let owner = await prisma.user.findUnique({
        where: { email: email }
    });
    
    if (!owner) {
        console.log(`Usuário não encontrado. Criando novo usuário para ${email}...`);
        const hashedPassword = await bcrypt.hash("mudar123", 10);
        owner = await prisma.user.create({
            data: {
                name: "Lucy",
                email: email,
                password: hashedPassword,
                role: "admin",
                status: "active"
            }
        });
        console.log(`[+] Usuário criado com sucesso: ${owner.name} (ID: ${owner.id})`);
    } else {
        console.log(`Usuário encontrado: ${owner.name} (ID: ${owner.id}).`);
    }
    
    console.log(`Iniciando importação de ${contacts.length} contatos...`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const contact of contacts) {
        // Verificar se já existe um cliente com o mesmo telefone para este proprietário
        const existing = await prisma.client.findFirst({
            where: {
                ownerUid: owner.id,
                phone: contact.phone
            }
        });
        
        if (existing) {
            console.log(`[-] Cliente ${contact.name} (${contact.phone}) já cadastrado. Pulando...`);
            skippedCount++;
            continue;
        }
        
        // Criar novo cliente
        await prisma.client.create({
            data: {
                ownerUid: owner.id,
                name: contact.name,
                phone: contact.phone
            }
        });
        
        console.log(`[+] Cliente cadastrado com sucesso: ${contact.name} (${contact.phone})`);
        createdCount++;
    }
    
    console.log("\n===============================================================================");
    console.log("PROCESSO DE IMPORTAÇÃO CONCLUÍDO!");
    console.log(`Total de contatos na lista: ${contacts.length}`);
    console.log(`Cadastrados com sucesso:   ${createdCount}`);
    console.log(`Pulados (já existentes):   ${skippedCount}`);
    console.log("===============================================================================");
}

main()
    .catch((e) => {
        console.error("Erro inesperado na execução:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
