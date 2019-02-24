# Contact form REST back-end powered by nodeJS, express and nodemailer

Intended to run as a systemd service and proxied by nginx in production.

It does not trust the client, handles invalid data and paths gracefully.

Configured for FastMail by default, but it can be used with any SMTP server.

It includes a demo contact form for use in testing or development (```public/index.html```)

## why?

I wanted a JS-powered contact form backend that ran as a standalone service and didn't rely on the systems sendmail. I couldn't find one, so I made one.

## features

No captchas.

Validates and sanitizes user supplied information. Secure defaults like binding to the loopback interface, text only emails and strict validation and sanitization.

Gracefully handles operational errors.

Bot-resistant***: Generic spam bots shouldnt succeed at sending email.

Configurable rate-limiting by IP in case abuse gets through.

Run as a system service in production. Logging, monitoring, etc.

## Use it

- for dev/testing:

```git clone``` this repo. ```npm install``` in the project folder.

Create the ```secrets.js``` file in the projects root folder. This will hold your username, password, and to (email destination) address. You can generate the file by running ```./generate_secrets_js.sh``` then entering your info. Or just copy/paste the following into secrets.js and enter your info:

```
module.exports = {
  user: 'user@domain.com',
  pass: 'password',
  to: 'target@domain.com'
};
``` 

```node server.js``` to start the server.


Visit ```http://localhost:8080/``` in your web browser to try it out.


- in production:

requires node.js (only tested with 9.x), nginx and a linux distro that uses systemd.



## demo contact form front-end

(```public/index.html```)

It is only served when ```NODE_ENV !== 'production'```, so for testing or development.

It implements basic HTML validation, a hidden form field to try and trick bots, sends message and receives status by XHR, error handling and is compatible with browsers back to IE11. It's a single file with no external dependencies and very minimal styling. I recommend using this as your contact form, as it implements a few tricks that the backend is expecting.

## detailed deployment instructions

create a user to run this service as. I picked ```ubuntu``` but if you are on amazon EC2 that user name might be in use already, so pick something different!

```adduser ubuntu```
enter a password


give the user sudo powers only for controlling the service:

/etc/sudoers.d/ubuntu

```
ubuntu ALL= NOPASSWD: /bin/systemctl start express-nodemailer-contact-api
ubuntu ALL= NOPASSWD: /bin/systemctl status express-nodemailer-contact-api
ubuntu ALL= NOPASSWD: /bin/systemctl stop express-nodemailer-contact-api
ubuntu ALL= NOPASSWD: /bin/systemctl restart express-nodemailer-contact-api
```

Clone this repo into /opt

set the file ownership to root so the user 'ubuntu' can't change the source code in /opt/express-nodemailer-contact-api

bash
```
cd /opt
chown -R root:root express-nodemailer-contact-api
```

This repo contains the file ```systemd/express-nodemailer-contact-api.service```. Edit it to match your settings, if they are different.

```
[Unit]
Description=Express Nodemailer Contact Form REST API
Requires=network-online.target nginx.service
After=syslog.target network-online.target

[Service]
ExecStart=/usr/bin/node /opt/express-nodemailer-contact-api/server.js
\# Required on some systems
WorkingDirectory=/opt/express-nodemailer-contact-api
Restart=always
 # Restart service after 10 seconds if node service crashes
 RestartSec=10
 # Output to syslog
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=express-nodemailer-contact-api
User=ubuntu
Group=ubuntu
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Notes:
* ExecStart wants the full path to your node binary followed by the full path to our server.js file
* Requires/After is to make our service start after syslog is up (for logging), the network stack has an IP address and nginx is started
* Working directory is apparently needed on some systems

Move the .service file to ```/etc/systemd/service``` and run (as root/sudo): 

```
systemctl daemon-reload

systemctl enable express-nodemailer-contact-api
```

check the status with (sudo/root) ```systemctl status express-nodemailer-contact-api```

you should see something like this:
```
● express-nodemailer-contact-api.service - Express Nodemailer Contact Form REST API
   Loaded: loaded (/etc/systemd/system/express-nodemailer-contact-api.service; enabled; vendor preset: enabled)
   Active: active (running) since Sun 2018-09-30 23:07:31 UTC; 29min ago
 Main PID: 25661 (node)
    Tasks: 10
   Memory: 18.9M
      CPU: 346ms
   CGroup: /system.slice/express-nodemailer-contact-api.service
           └─25661 /usr/bin/node /home/ubuntu/express-nodemailer-contact-form/server.js
```

if it is not running yet, run (as sudo/root): ```systemctl start express-nodemailer-contact-api```

With that done, systemd will take care of starting the service after reboot, monitoring the process and restarting if it is killed or crashes and logging.

Now we need to tell nginx to proxy requests for our service.

```
cd /etc/nginx/sites-enabled
```

Open the config file for the domain you want to use this service on. We will add the ```location /api``` block to our main ```server``` block. This is an example ```server``` block for an otherwise static https site, just to give you some context

```
server {

    listen [::]:443 ssl http2 ipv6only=on;
    listen 443 ssl http2;
    # other ssl stuff #

	root /path/to/root;
	error_page 404 /404.html;
	
	index index.html;

	server_name yourdomain.ca www.yourdomain.ca;

	location / {
		try_files $uri $uri/ =404;
	}

    # this is the location block we are adding#

	location /api/ {
		proxy_pass http://127.0.0.1:8080/;
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}

    ##########################################
}
```
That is all it takes to tell nginx to terminate ssl, set some headers, and proxy the request to our node server. The ```X-Forwarded-For``` header lets our node server know the IP of the original requester. Without it, to our node app it would appear that all the requests came from nginx.

In fact, express's "trust proxy" automagically handles this, seamlessly returning the clients IP when accessing ```req.ip```, so our application logic can be blissfully unaware of this process. Note: When using express trust proxy (```app.enable("trust proxy")```), the node server must not be directly accessible to the internet. This is because it instructs our node server to trust the ```X-Forwarded-For``` header, which could be easily spoofed. This is why our node server binds to ```127.0.0.1```, also known as the loopback interface. This makes it only accessible from the same (virtual) machine. If nobody can directly access the node server from the open internet without first going through our nginx reverse proxy, it is OK to trust that header. But if we instead bound the node server to 0.0.0.0 (shorthand for all available network interfaces) and opened our firewall on port 8080, our node server could be used in DoS attacks. An attacker could forge the X-Forwarded-For header, resulting in our node server sending its response to an IP of the attackers choosing.

Binding to the loopback interface is not foolproof, however. It may be a security improvement to bind instead to a unix socket. Unix sockets are used for communication between two processes on the same machine, whereas TCP/IP sockets have more overhead and are intended for communication over a network. I experimented with this, but I had some issues with the socket not being cleaned up after restarts.


...But I digress!

Restart nginx with ```systemctl restart nginx``` and you should be good to go!





