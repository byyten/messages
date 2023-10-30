
// script for messages page 

let iam
let member_list         // right panel div
let member_list_ul     // ul member_list
let member_el_clone    // an li element to clone, populate and append
let speech_left_clone
let speech_right_clone
let messagestream
let stream
let recipients 
let recipient_option_clone

let profile 
let _id 
let anom 
let avatar_img 
let email 
let forename 
let surname 

let choose_avatar
let edit_profile
let attachments
let attach
let message_recipients
let message_payload
let message_send

const add_attachment = async (evt) => {
  file = evt.target.files[0]
  src = await readFile(file)
  img = new Image()
  img.src = src
  img.filename = file.name
  img.size = file.size
  img.type = file.type
  img.width = 100
  img.addEventListener("click", evt => { remove_attachment(evt) })  
  attachments.appendChild(img)
}

const remove_attachment = (evt) => {
  resp = confirm("remove this attachment?")
  if (resp) {
    img = evt.target
    img.parentNode.removeChild(img)
  }
}

const set_index = async () => {
  member_list = document.querySelector(".member_list")
  member_list_ul = member_list.querySelector("ul.member_list")
  member_el_clone = member_list_ul.querySelector("li")
  member_list_ul.removeChild(member_el_clone)

  messagestream = document.querySelector(".messagestream")
  stream = messagestream.querySelector("ul.stream")
  speech_left_clone = stream.querySelector("li.stream.left")
  stream.removeChild(speech_left_clone)
  speech_right_clone = stream.querySelector("li.stream.right")
  stream.removeChild(speech_right_clone)

  recipients = messagestream.querySelector("select#recipients")
  recipient_option_clone  = recipients.querySelector("option")

  profile = document.querySelector(".profile")
  _id = profile.querySelector("input._id")
  anom = profile.querySelector("input.anom")
  avatar_img = profile.querySelector("img#avatar")
  email = profile.querySelector("input.email")
  forename = profile.querySelector("input.forename")
  surname = profile.querySelector("input.surname")
  choose_avatar = profile.querySelector("input#choose_avatar")
  choose_avatar.addEventListener("change", async (evt) => {
    let file = evt.target.files[0]
    avatar_img.src = await readFile(file)
    try {
      update_profile("avatar", avatar_img.src)
    } catch (err) {
      alert("update avatar fail: " + err)
      console.log(err)
    }
  })
  edit_profile = profile.querySelector(".edit_profile")
  edit_profile.addEventListener("click", (evt) => {
    main = profile.querySelector(".main")
    main.style.display = main.style.display === "none" ? "block" : "none" 
  })
  
  change_password = profile.querySelector(".change_password")
  change_password.addEventListener("click", (evt) => {
    window.location = "/reset"
  })

  unregister = profile.querySelector(".unregister")
  unregister.addEventListener("click", (evt) => {
    yn = confirm("Unregistering your account\n---------------------\n\nUnregistering your account will disable the account\nand make your messages inaccessible\nIt is an action that cannot be reversed!\nConfirm OK to remove, cancel to maintain")
    if (yn) {
      window.location = "/unregister"
    }
  })

  attachments = messagestream.querySelector(".attachments")
  attach = messagestream.querySelector(" input#attachment")
  attach.addEventListener("change", async (evt) => {
    add_attachment(evt)
  })
  
  message_recipients = messagestream.querySelector("select.recipients")
  message_payload = messagestream.querySelector("input.payload")
  
  message_send = messagestream.querySelector("button.send")
  message_send.addEventListener("click", (evt => {
    send_message()
  }))

  logout = profile.querySelector("button.logout")
  logout.addEventListener("click", async (evt) => {
    off = await fetch("/logout", { method:"post" })
    console.log(off)  
  })

  members = await get_members()
  iam = anom.value
  others = members.filter(mbr => mbr.anom !== iam)
  set_member_list(others)
  sender = _id.value 
  msgs = await messages_to_from(sender)
  populate_stream(msgs);
  set_recipients();
  [anom, email, forename, surname].forEach(el => {
    el.addEventListener("change", async (evt) => { 
      try {
        upd_res = await update_profile(evt.target.classList[0], evt.target.value)
        // console.log((await upd_res.json()))
      } catch (err) {
        console.log(err)
      }    
    })
  })
}

window.onload = async () => {
  try {
    set_index()
  } catch (err) {
    console.log(err)
  }
}

const send_message = async () => {
  if (message_recipients.value === "-1") {
    alert("Incomplete\n--------------------------\n\nmust identify message recipient/s")
    return
  }
  
  message_images = Array.from(attachments.querySelectorAll("img"))
  attached_images = message_images.map(img => {
    return {
      payload: img.src,
      filename: img.filename,
      size: img.size,
      type: img.type
    }
  })

  message = {
    timestamp: new Date().toISOString(),
    sender: _id.value,
    recipient: [message_recipients.value],
    payload: message_payload.value, 
    attachments: attached_images
  }
  // send it
  send_resp = await fetch("/api/v1/send_message", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message)
  })
  try {
    res = await send_resp.json()
    if (res.status === 200 ) {
        attachments.innerHTML = ""
        message_recipients.selectedIndex = 0
        message_payload.value = ""
        
        msgs = await messages_to_from(sender)
        clear_stream() 
        populate_stream(msgs);
        stream.scrollTop = stream.scrollHeight;
    }
  } catch (err) {
    console.log(err)
    alert("send failure: " + err)
  }
}

let readUrl = async (_url, fn) => {
    let url = _url + fn
    fetch(url).then(r=> r.blob()).then(blob => {  
        i.url = url
        var reader  = new FileReader();
        reader.onload = function onload(evt)  {
            i.src = evt.target.result
        } 
        reader.readAsDataURL(blob)
    })
}

const readFile = (file) => {
  // https://masteringjs.io/tutorials/fundamentals/filereader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = evt => {
      resolve(evt.target.result);
    };
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

let set_profile = (account) => {
  _id.value = account._id
  if (account.avatar) {
    let b64 = account.avatar
    set_avatar(avatar_img, b64)
  } else {
    set_avatar(avatar_img, "not-set?") 
  }
  
    anom.value = account.anom
  
  let profile_ul = profile.querySelector("ul._profile")
  let profile_input = profile_ul.querySelectorAll("input")
    profile_input[0].value = account.email
    profile_input[1].value = account.forename === undefined ? "" : account.forename
    profile_input[2].value = account.surname === undefined ? "" : account.surname 
}

let update_profile = async (key, val) => {
  try {
    let upd_res = await fetch("/api/v1/update_profile", {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: _id.value, key: key, value: val })
    })
    res = await upd_res.json()
    console.log(res)
  } catch (err) {
    console.log(err)
  }

}

let set_member_list = (mbrs) => {
    mbrs.forEach(mbr => {
        let clone = member_el_clone.cloneNode(true)
        let img = clone.querySelector('img')
        img.src = mbr.avatar
        img.alt = "avatar image for member " + mbr.anom
        img.title = "avatar image for member " + mbr.anom
        clone.querySelector('span.anom').textContent = mbr.anom
        member_list_ul.appendChild(clone)
    })
}

let set_avatar = (avatar, avatar_b64) => {
    avatar.src = avatar_b64
}

const get_members = async () => {
    mbr_res = await fetch("/api/v1/members");
    return  await mbr_res.json()
}
  
let messages_to_from = async (sender, recipient) => {
    api_messages_resp = await fetch("api/v1/messages", {
      method: "post",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ sender: sender, recipient: recipient })
    })
    return messages = await api_messages_resp.json()  
}

let clear_stream = () => {
	stream.innerHTML = ""
}

let message_as_sender = (msg) => {
  clone = speech_left_clone.cloneNode(true)
  clone.style.visibility = "visible"
  recips = msg.recipient.map(rec => {
    return members.find(m => m._id === rec._id).anom
  })
  
  clone.querySelector("span.payload_owner").textContent = recips.join(",")
  clone.querySelector("span.payload_time").textContent = new Date(msg.timestamp).toLocaleTimeString().slice(0,5)
  
  clone.querySelector('.payload_text').textContent = msg.payload
  clone.querySelector(".payload_controls").style.display = "none"
  if (msg.attachments.length) {
    let attached = clone.querySelector(".payload_attached")
    attached.innerHTML = ""
      msg.attachments.forEach(att => {
        img = new Image()
        img.src = att.payload
        img.width = 50
        img.setAttribute("alt", "file: " + att.filename)
        img.setAttribute("title", "file: " + att.filename)
        
        anchor = document.createElement("a")
        anchor.appendChild(img)
        // anchor.download = att.filename  
        anchor.target = "_blank"
        anchor.href = att.payload
        
        attached.appendChild(anchor)
      })
  }  
  stream.appendChild(clone)
}

let message_as_recipient = (msg) => {
  clone = speech_right_clone.cloneNode(true)
  clone.style.visibility = "visible"
  
  // recipients = members.find(m => m._id === msg.sender)
  // recips = msg.recipient.map(rec => {
  //   return members.find(m => m._id === rec._id).anom
  // })
  clone.querySelector("span.payload_owner").textContent = members.find(m => m._id === msg.sender) ? members.find(m => m._id === msg.sender).anom : "" // recips.join(",")
  clone.querySelector("span.payload_time").textContent = new Date(msg.timestamp).toLocaleTimeString().slice(0,5)

  clone.querySelector('.payload_text').textContent = msg.payload
  clone.querySelector(".payload_controls").style.display = "none"

  if (msg.attachments.length) {
    let attached = clone.querySelector(".payload_attached")
    attached.innerHTML = ""
      msg.attachments.forEach(att => {
        a = document.createElement("a")
        // a.download = att.filename
        a.target = "_blank"
        a.href = att.payload
        i = new Image()
        i.src = att.payload
        i.setAttribute("alt", "file: " + att.filename)
        i.setAttribute("title", "file: " + att.filename)
        i.width = 50
        a.appendChild(i)
        attached.appendChild(a)
      })
  }  
  
  stream.appendChild(clone)
}

let populate_stream = (messages) => {
    if (messages.length === 0) {
      stream.textContent = "No messages, get on the case ..."
      return
    }
    sender = _id.value
    messages.forEach(msg => {
        if (msg.sender === sender) { 
          message_as_sender(msg)         

        } else  {  // if not sender then is recipient
          message_as_recipient(msg)
        }
      })
      stream.scrollTop = stream.scrollHeight;
}

let set_recipients = () => {
  members.forEach(mbr => {
    if (mbr.anom !== anom.value) {
      let clone = recipient_option_clone.cloneNode(true)
      clone.value = mbr._id
      clone.textContent = mbr.anom
      recipients.appendChild(clone)
    }
  })
}


//   sender = "6539dd1f519e674d8c890354" 
//   recipient = "6539dd55519e674d8c890355"
//   msgs = await messages_to_from(sender, recipient)
//   msgs_sender = msgs.filter(m => m.sender === sender)
//   msgs_recipient= msgs.filter(m => m.sender === recipient)

// let setup_member_list = () => {
//     member_list = document.querySelector(".member_list")
//     member_list_ul = member_list.querySelector("ul.member_list")
//     member_el_clone = member_list_ul.querySelector("li")
//     member_list_ul.removeChild(member_el_clone)
// }

/*
 var canvas = document.createElement("canvas")
    var ctx = canvas.getContext('2d')

    var img = new Image()
    img.src = your_file_url + '?' + new Date().getTime();
    img.setAttribute('crossOrigin', '')

    var array = your_file_url.src.split("/")
    var fileName = array[array.length - 1]

    img.onload = function() {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img,
            0, 0, img.naturalWidth, img.naturalHeight,
            0, 0, canvas.width, canvas.height)

        var dataUrl = canvas.toDataURL("image/png", 1)

        var a = document.createElement('a')
        a.href = dataUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }


*/


