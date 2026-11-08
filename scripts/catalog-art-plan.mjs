import { readFileSync, writeFileSync } from 'node:fs';
const sceneMap = {
  'Sguardi dolci': [
    'A fictional adult woman around 30 with warm brown eyes and curly chestnut hair, soft window light, a calm thoughtful expression, elegant portrait',
    'A fictional adult man around 32 with deep brown skin, gentle hazel eyes and short textured hair, warm late-afternoon portrait light',
    'A fictional adult East Asian woman around 35 with a short dark bob and serene expressive eyes, delicate rain reflections behind her',
  ],
  'Sorrisi contagiosi': [
    'A fictional adult woman around 30 laughing naturally on a sunlit rooftop, curly red hair and joyful expressive smile',
    'A fictional adult man around 35 laughing over coffee on a pastel terrace, dark wavy hair and casual blue shirt',
    'A fictional adult woman around 40 with dark skin, short silver hair and a bright warm genuine smile in golden-hour light',
  ],
  'Ritratti cinematografici': [
    'A fictional adult woman detective around 35 in a violet raincoat at a rain-streaked diner window, dramatic cyan and amber cinema lighting',
    'A fictional adult male musician around 40 in a dark velvet jacket, dramatic side-lit portrait in an empty theater',
    'A fictional adult androgynous artist around 30 framed by an old cinema projector beam and indigo haze',
  ],
  'Outfit della serata': [
    'Full-body editorial fashion portrait of a fictional adult woman around 30 wearing a sculptural violet oversized suit with cyan accents on a modern city staircase',
    'Full-body editorial fashion portrait of a fictional adult man around 30 in a cream cropped jacket and dark wide-leg trousers, sophisticated night streetwear',
    'Full-body editorial fashion portrait of a fictional adult androgynous model around 30 in layered black and iridescent-magenta streetwear against blue urban glass',
  ],
  'Occhiali da urlo': [
    'Original sculptural translucent lavender sunglasses on a warm ivory stone pedestal, beautiful optical reflections and studio product photography',
    'Original angular polished-chrome sunglasses on a fictional adult woman around 30, close editorial portrait with neon cyan light',
    'Original orange-tinted circular futuristic sunglasses on a black marble plinth, macro product composition with violet light',
  ],
  'Facce da meme': [
    'Playful portrait of a fictional adult man around 35 with an exaggerated surprised expression as one tiny soap bubble lands on his nose, kind humorous editorial style',
    'Playful portrait of a fictional adult woman around 30 with curly hair and a comically skeptical eyebrow, colorful studio portrait, no writing',
    'Fictional adult chef around 40 with a wide-eyed delighted expression while admiring an improbably tiny dessert, gentle wholesome humor',
  ],
  'Cosplay iconici': [
    'Original fictional adult moon-knight cosplayer around 30 in intricate white and violet armor with a crescent spear, cinematic full-body costume portrait, no existing franchise',
    'Original fictional adult botanical mage cosplayer around 30 wearing elaborate emerald and lavender layered robes and sculptural leaf accessories, no existing franchise',
    'Original fictional adult retro-futurist space pilot cosplayer around 35 in orange and indigo tailored flight gear, beautiful crafted costume, no existing franchise',
  ],
  'Look retro': [
    'Fictional adult woman around 30 in an elegant 1960s-inspired lavender coat, cream boots and geometric hair styling, vintage editorial aesthetic',
    'Fictional adult man around 35 in a 1970s-inspired rust corduroy suit and open-collar cream shirt, tasteful cinematic vintage portrait',
    'Fictional adult model around 30 in an original 1980s-inspired cobalt and magenta fashion look, nostalgic studio set, no brand logos',
  ],
  'Margherita perfetta': [
    'A magnificent authentic-looking Neapolitan margherita pizza with airy charred crust, melted mozzarella, bright tomato and fresh basil on a dark stone table, appetizing food editorial',
    'Overhead close food composition of a crisp thin margherita pizza on handmade ceramic, tiny basil leaves and glossy tomato, warm window light',
    'A slice lifting away from a fresh margherita pizza with delicate mozzarella strands and charred leopard crust, beautiful dark food photography',
  ],
  'Pizza impossibile': [
    'An imaginative artisan pizza with violet potato petals, golden squash ribbons and vivid green pesto spirals, refined edible surreal food styling',
    'An extravagant star-shaped pizza with folded golden points and colorful roasted tomatoes, appetizing original food composition',
    'A sculptural pizza with a dramatic rising spiral crust and layers of colorful vegetables, delicious-looking playful culinary art',
  ],
  'Burger esagerati': [
    'An extravagant gourmet beef-style burger with glossy brioche, melted cheddar, red onion and crisp greens, dramatic appetizing dark food photography',
    'A towering golden crispy-chicken-style burger with fresh slaw, pickles and a beautifully toasted bun, warm food editorial',
    'An inventive gourmet mushroom burger with purple cabbage, grilled vegetables and rich sauce, glossy bun, vivid appetizing food photography',
  ],
  'Dessert indecenti': [
    'A dark chocolate lava cake opening to a glossy molten center with a small raspberry and handmade ceramic plate, exquisite close food photography',
    'A sculptural layered chocolate mousse dessert with delicate curled chocolate ribbons and cocoa dust, luxurious dark food editorial',
    'A rich chocolate tart with mirror glaze and a single golden caramel shard, minimal elegant appetizing composition',
  ],
  'Torte spettacolari': [
    'A spectacular three-tier pastel lavender cake with delicate edible translucent sugar flowers, refined modern patisserie editorial',
    'An extraordinary sculptural cake with white chocolate ribbons and vivid raspberry layers, dramatic black background and soft rim light',
    'An elegant geometric emerald and ivory mousse cake with gold-colored sugar arcs, immaculate patisserie product photography',
  ],
  'Piatti scenografici': [
    'A refined plated saffron risotto arranged as a spiral with edible flowers and herb oil, overhead artistic food photography',
    'A dramatic modern vegetarian tasting plate with colorful roasted vegetables arranged like a miniature landscape, elegant handmade ceramic',
    'A sculptural fresh pasta nest with jewel-toned tomato and basil accents, beautiful restrained fine-dining composition',
  ],
  'Drink neon': [
    'A beautiful non-alcoholic electric-blue mocktail in sculptural clear glass with lime, shimmering ice and neon cyan reflections',
    'A beautiful non-alcoholic pink dragon-fruit mocktail with rosemary and frosted glass, magenta studio light and dark backdrop',
    'A beautiful non-alcoholic violet butterfly-pea and citrus mocktail with a delicate gradient and large clear ice cube, premium beverage editorial',
  ],
  'RGB estremo': [
    'An original high-end gaming desk with violet and cyan RGB light, sculptural keyboard, glass computer case and three panoramic screens showing abstract art, dark immaculate technology editorial',
    'An original amber and magenta gaming desk with a custom translucent computer tower and glowing mechanical keyboard, precise sophisticated product scene',
    'An original icy-cyan minimalist gaming desk with dramatic indigo ambient light, ultrawide monitor and suspended acoustic panels, premium tech interior',
  ],
  'Gaming room da sogno': [
    'An extraordinary original gaming room with a huge curved window overlooking a fictional rainy city, violet light strips and thoughtful cozy architecture',
    'An extraordinary original gaming room inside a small futuristic loft with warm wood, emerald accent lights and a panoramic desk',
    'An extraordinary original gaming room in a sculptural white and lavender interior, illuminated display shelves and comfortable lounge seating',
  ],
  'Armature leggendarie': [
    'An original intricate fictional adult knight armor forged from black metal with violet crystalline inlays, majestic full-body silhouette in a fantasy hall',
    'An original elegant ivory and copper ceremonial fantasy armor displayed in a dramatic museum-like alcove, extraordinary craftsmanship',
    'An original fictional adult ranger wearing emerald and bronze leaf-inspired fantasy armor beside ancient luminous trees, no existing franchise',
  ],
  'Mondi retro': [
    'A beautiful detailed original pixel-art floating island village at violet sunset, tiny waterfalls, lanterns and lush trees, nostalgic game environment, no existing game',
    'A beautiful detailed original pixel-art cyberpunk rain street with turquoise puddles and magenta windows, deep layered perspective, no readable signage',
    'A beautiful detailed original pixel-art seaside observatory under a star-filled indigo sky, warm lit windows and a crescent moon, no existing game',
  ],
  'Gatti criminali': [
    'A mischievous fluffy orange cat caught stealing a croissant from an elegant breakfast table, comically innocent expression, wholesome editorial animal portrait',
    'A sleek black cat sitting inside an open jewelry box beside scattered shiny buttons, harmless mock-heist mood and violet light',
    'A white-and-gray cat peeking from a shopping bag with a stolen ribbon in its mouth, playful expressive close animal portrait',
  ],
  'Momenti assurdi': [
    'A very serious capybara sitting at an impeccably arranged tiny office desk in a lavender greenhouse, whimsical tasteful surreal humor',
    'A duck wearing a tiny original orange raincoat standing beside an oversized puddle reflection of a palace, playful original cinematic scene',
    'A fluffy white dog confidently riding on a stationary futuristic luggage trolley surrounded by floating colorful balloons, wholesome absurd humor',
  ],
  'Tramonti impossibili': [
    'An extraordinary violet and peach sunset over a mirror-still salt lake, dramatic sculptural clouds and tiny distant mountains, cinematic landscape',
    'An extraordinary fiery amber sunset over a dark ocean arch, lavender mist and beautiful layered cloud formations, original cinematic landscape',
    'An extraordinary rose and cyan twilight above luminous sand dunes with a huge soft moon, clearly fictional dreamy landscape',
  ],
  'Neon metropolitani': [
    'An original fictional rainy city alley with cyan and magenta light reflected in wet pavement, tasteful abstract signage without readable words, cinematic urban photography',
    'An original fictional elevated rooftop garden overlooking a dense neon metropolis at dusk, violet windows and warm intimate foreground lights',
    'An original fictional futuristic tram gliding through a narrow blue-hour city street, glowing teal rails, amber windows and soft rain',
  ],
  'Viste epiche': [
    'A magnificent alpine mountain ridge rising above a sea of dawn clouds, violet snow shadows and warm peach sunlight, cinematic original landscape',
    'A monumental emerald mountain valley with a turquoise winding river and distant waterfalls, misty atmospheric depth, original landscape',
    'A dramatic volcanic mountain reflected in an icy dark lake beneath subtle aurora colors, original cinematic landscape',
  ],
  'Dormire sugli alberi': [
    'An original beautiful compact glass treehouse wrapped around a giant tree in a misty forest, warm interior lights and elegant suspended walkway',
    'An original sculptural wooden treehouse with rounded copper roof and a cozy balcony above a rainforest canopy at dawn',
    'An original minimalist lavender-and-cedar treehouse among autumn trees, circular windows and soft warm evening light, architectural visualization',
  ],
  'Spiagge da sogno': [
    'An original idyllic turquoise cove framed by white limestone cliffs and flowering plants, tiny pristine beach, cinematic Mediterranean-inspired landscape',
    'An original pink-sand tropical beach with sculptural palms and clear shallow aquamarine water at sunrise, tranquil premium travel aesthetic',
    'An original dramatic black-sand beach with luminous teal surf and distant green coastal mountains, moody cinematic landscape',
  ],
  'Mini case geniali': [
    'An original ingenious tiny house interior with warm oak built-in storage, a loft bed, panoramic window and soft lavender textiles, beautiful architectural visualization',
    'An original compact sculptural cabin on a rocky coastal terrace, elegant folding glass facade, warm cedar and thoughtful small-space design',
    'An original beautifully designed micro-home with a circular skylight, curved white walls, compact kitchen and emerald plants, architectural visualization',
  ],
  'Auto da film': [
    'An original futuristic violet electric sports coupe with sculptural chrome details on a rainy neon street, cinematic automotive editorial, no brand or recognizable production model',
    'An original matte ivory retro-futurist grand touring car in a golden desert, long elegant silhouette and amber glass, no brand logos',
    'An original indigo sci-fi rally car with luminous cyan wheel accents inside a dramatic concrete tunnel, no real vehicle brand or existing movie design',
  ],
  'Oggetti impossibili': [
    'An original polished chrome sculpture of a ribbon forming an impossible suspended knot above a black stone pedestal, violet gallery lighting',
    'An original translucent peach glass sculpture of interlocking floating toroids, elegant dark gallery and cyan refractions',
    'An original sculptural chair formed from a continuous twisting lavender ceramic surface, beautiful impossible-design gallery presentation',
  ],
  'Dettagli alieni': [
    'An extraordinary original macro image of iridescent soap-film membranes stretched across a delicate wire spiral, jewel tones and fine luminous texture',
    'An extraordinary original macro image of a fictional translucent leaf with intricate cyan veins and violet dew drops, artistic natural-inspired detail',
    'An extraordinary original macro image of shimmering crystalline mineral folds with copper and indigo facets, alien abstract tactile detail',
  ],
  'Sneakers futuristiche': [
    'An original premium futuristic lavender sneaker with sculptural translucent sole and intricate knit upper, dramatic clean product photography, no brand logos',
    'An original premium ivory and orange futuristic sneaker floating above a black pedestal, architectural sole design and exquisite materials, no brand logos',
    'An original premium matte charcoal sneaker with luminous cyan structural details and elegant ergonomic form, dark product editorial, no brand logos',
  ],
  'Meme surreali': [
    'A tiny majestic astronaut cat riding a giant buttered croissant through a lavender nebula, whimsical original surreal illustration, no text',
    'A dignified capybara calmly sitting inside a floating teacup above a miniature futuristic city, exquisite playful surreal digital art, no text',
    'A cheerful original robot carefully watering a glowing moon growing in a flowerpot, funny poetic digital illustration, no existing character or text',
  ],
};
const catalog = JSON.parse(readFileSync('assets/art/catalog.json', 'utf8'));
const prompts = [];
for (const [leaf, scenes] of Object.entries(sceneMap))
  for (let variant = 0; variant < 3; variant++) {
    const file = `catalog-${String(prompts.length + 1).padStart(3, '0')}.png`;
    const prompt = `Use case: ${leaf === 'Mondi retro' ? 'stylized-concept' : 'photorealistic-natural'}. Create a completely original premium portrait 2:3 image for the VOTILT mobile visual feed, category ${leaf}. ${scenes[variant]}. Rich cinematic atmosphere, sophisticated composition, convincing materials and beautiful carefully chosen colors. Make the main subject readable on a phone. No text, no letters, no UI, no logos, no watermark. All people are explicitly fictional adults aged at least 30, never celebrities or real identifiable people. This image will be correctly labelled AI-generated in the app, never a verified real photograph.`;
    prompts.push({ leaf, variant, file, prompt, status: 'pending' });
  }
writeFileSync('assets/art/full-catalog-plan.json', JSON.stringify(prompts, null, 2));
console.log(
  `Piano immagini: ${prompts.length} artwork dedicati, oltre ai ${catalog.length} già generati.`,
);
