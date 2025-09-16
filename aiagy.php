<?php
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">     
<link rel="shortcut icon" href="sůuretter/taꞑba-aqsai3-10a.svg" type="image/svg">
<title>Aqsai3-10a - ůi býrlestýgý</title>
<link rel='stylesheet' href='yi.css' type='text/css'/> 
</head>

<script type="text/javascript">
document.ondragstart = test;
document.onselectstart = test;
document.oncontextmenu = test;
function test(){return false}
</script>

<body>

<footer>
<p>Aqsai3-10a yi birlestigi</p>
</footer>

<script type="text/javascript">
   const list = document.querySelectorAll('.list');

function accordion(e){
    e.stopPropagation(); 
    if(this.classList.contains('active')){
        this.classList.remove('active');
    }
    else if(this.parentElement.parentElement.classList.contains('active')){
        this.classList.add('active');
    }
    else{
        for(i=0; i < list.length; i++){
          list[i].classList.remove('active');
        }
            this.classList.add('active');
        }
}
for(i = 0; i < list.length; i++ ){
    list[i].addEventListener('click', accordion);
}
</script>

</body>
</html>
?>
