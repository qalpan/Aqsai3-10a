<?php
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $to = "sk-joba@outlook.com";    // Куда идет письмо
        $from = "sk-joba@outlook.com";    // От кого идет письмо
        $name = htmlspecialchars($_POST['name-at']);
        $email = htmlspecialchars($_POST['email-at']);
        $message = htmlspecialchars($_POST['message-at']);
        $subject = htmlspecialchars($_POST['subject-at']);
        $return_arr = array();
        $return_arr["frm_check"] = '';
        // Еще раз проверим заполненные поля формы. 
        // Эту проверку можно удалить или удалить проверку на JS
        if($name=="" || $email=="" || $message=="" || $subject=="") {
            $return_arr["frm_check"] = 'error';
            $return_arr["msg"] = "Пожалуйста, заполните все поля!";            
        }     
        // Проверка на плохие слова. Если не мучают хулиганы, можно ее удалить.
        $badwords = array('предложение', 'купить', 'раскрутка'); 
        $banstring = ($message != str_ireplace($badwords,"XX",$message))? true: false; if ($banstring) { 
            $return_arr["frm_check"] = 'error';
            $return_arr["msg"] = "Есть запрещенные слова";    
        }
        
        if ($return_arr["frm_check"] != 'error') {    
        
// Отправка в ТГ        
$token = "AAA";
$chat_id = "BBB";                
$txt = "
<b>Тема:</b> $subject,
<b>Имя:</b> $name,
<b>Контакт:</b> $email,
<b>Сообщение:</b> 
$message
";
$txt = urlencode($txt);
$sendToTelegram = fopen("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=html&text={$txt}","r");        
        
// Отправка на почту
$mailtxt = "
Тема: $subject,
Имя: $name,
Контакт: $email,
Сообщение: 
$message
";
            
$headers = "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= "From: $from\r\n";
$headers .= "Reply-To: $from\r\n";    
            
            if (!mail($to, $subject, $mailtxt, $headers)) {
                $return_arr["frm_check"] = 'error';
                $return_arr["msg"] = "Сообщение не отправлено, ошибка почтового сервера!";    
            }        
        }        
        echo json_encode($return_arr);
    }
?>
