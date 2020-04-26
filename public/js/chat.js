const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messsage = document.querySelector('#message');

//templates

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});


socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error);
        location.href = '/';
    }
});


const autoScroll = ()=>{

    const $newMessage = $messsage.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messsage.offsetHeight;

    const containerHeight = $messsage.scrollHeight;

    const scrollOffset = $messsage.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messsage.scrollTop = $messsage.scrollHeight
    }

}

socket.on('activeUsers', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
})

socket.on('message', (msg)=>{
    console.log(msg);
    const message = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messsage.insertAdjacentHTML('beforeend', message);
    autoScroll();
});

socket.on('locationMessage', location =>{
   const url = Mustache.render(locationTemplate, {
       username: location.username,
       url : location.url,
       createdAt: moment(location.createdAt).format('h:mm a')
   });
   $messsage.insertAdjacentHTML('beforeend', url);
   autoScroll();
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    $messageButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    socket.emit('newMessage', message, (error)=>{
        $messageButton.removeAttribute('disabled');
        $messageInput.value = '';
        $messageInput.focus();
        if(error){
            return console.log(error);
        }
        console.log('Delivered');
        
    });
});

$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }
    $locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition(position =>{
        socket.emit('sendLocation', {latitude:position.coords.latitude, longitude:position.coords.longitude}, (message)=>{
            $locationButton.removeAttribute('disabled');
            console.log(message);
        })
    })
})
