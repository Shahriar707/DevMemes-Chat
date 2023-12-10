var images = document.getElementsByClassName("meme_image");
var templateInput = document.getElementById("template_id");
for(const i of images){
    i.addEventListener('click', (e) => {
        templateInput.value = i.id;
    });
}
