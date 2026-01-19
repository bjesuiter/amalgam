# What is exe.dev?

**1. Introduction**

*VMs, on the internet, quickly*


exe.dev is a subscription service that gives you virtual machines, with
persistent disks, quickly and without fuss. These machines are immediately
accessible over HTTPS, with sensible and secure defaults. You can share your
web server as easily as you can share a Google Doc. With built-in optional
authentication, so you can focus on your thing.

Your VMs share CPU/RAM. Create as many VMs as you like with the resources
you have.


---

# Why EXE?

**1. Introduction**

*EXE is just a computer.*


Developers need computers. Sometimes we need those computers to be on the internet, to keep running when we close our laptop lid or when our desktop goes to sleep. We need that because they have work to do in a cron job, or our colleagues or friends need access to them.

These computers need to be **secure**. Only we should be able to ssh into them and do things. We should be able to run a web server on port 80 and make sure only people we want can reach it. Having to build a password database (remember to hash and salt and build a rigorous email recovery flow), or oauth integration, or fiddle with any other sort of auth and how it works with the language and framework you chose, is a huge distraction.

Other than that, it should just be a computer. We don’t need config files filled with options. It should be some kind of stock linux, the disk should be persistent, the disk should be fast. Setup should be an easy one-liner, that is scriptable. It should have a domain name. It should not, in isolation, cost some dollars a month and have dedicated resources, it should be a fully functional VM that shares CPU and RAM out of my fixed-price allotment.

_Just a computer._

Want to build a soccer scheduling app for your kids school? Want a VM to try out agent-of-the-week on a project where it cannot trash your laptop's dot files (or bug you for permission to `ls` every five seconds)? Run `ssh exe.dev new`

That is what exe.dev gives you. Pay a monthly fee for some compute resources. Spin up as many VMs as you like. Resource management and auth are taken care of for you.


---

# Pricing

**1. Introduction**

*Plan options for individuals, teams, and enterprises.*


While we are in alpha, every new account automatically runs on a free trial with full Individual plan access. When billing begins you'll be able to pick the plan that fits you:

<table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
  <thead>
    <tr>
      <th style="border: 1px solid #000; padding: 12px; vertical-align: top;">Individual</th>
      <th style="border: 1px solid #000; padding: 12px; vertical-align: top;">Team</th>
      <th style="border: 1px solid #000; padding: 12px; vertical-align: top;">Enterprise</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #000; padding: 12px; vertical-align: top;">
        <strong>$20/month</strong>
        <ul>
          <li><b>25 VMs</b></li>
          <li>2 CPUs</li>
          <li>8GB RAM</li>
          <li>25GB&nbsp;disk<sup>+</sup></li>
          <li>100GB&nbsp;bandwidth<sup>+</sup></li>
        </ul>
      </td>
      <td style="border: 1px solid #000; padding: 12px; vertical-align: top;">
        <strong>$25/month/user</strong>
        <ul>
          <li><b>25 VMs</b></li>
          <li>2 CPUs</li>
          <li>8GB RAM</li>
          <li>25GB disk<sup>+</sup></li>
          <li>100GB bandwidth<sup>+</sup></li>
          <li>Admin and user management for shared environments</li>
          <li>SSO</li>
        </ul>
      </td>
      <td style="border: 1px solid #000; padding: 12px; vertical-align: top;">
        <strong>$30/month/user</strong>
        <ul>
          <li><b>30 VMs</b></li>
          <li>2 CPUs</li>
          <li>16GB RAM</li>
          <li>25GB disk<sup>+</sup></li>
          <li>100GB bandwidth<sup>+</sup></li>
          <li>Admin and user management for shared environments</li>
          <li>SSO</li>
          <li>AWS VPC integration</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

<p style="font-size: 11px;"><sup>+</sup> Additional disk $0.08/GB/month; additional bandwidth $0.07/GB/month.</p>

VMs share the resources allocated to the user.

In teams, users can use some of their team-mate's resources as burstable capacity.

Need something custom? [Contact us](mailto:support@exe.dev) and we'll help scope it.


---

# exe.dev HTTP Proxies

**2. Features**

*Publish to the Internet, both privately and publicly*


<img src="proxy.svg" alt="Diagram of HTTPS Proxy Flow" width="100%"/>

`exe.dev` proxies traffic to https://vmname.exe.xyz/ to your VM seamlessly, handling
certificates, TLS termination, and optionally offering basic authentication.

## Configuring which port to proxy

By default, `exe.dev` attempts to automatically pick a good port.
It works from the set of ports exposed by the `EXPOSE` directive in a `Dockerfile`,
preferring port 80 and falling back to the smallest exposed TCP port >= 1024.

You can change the port chosen with `ssh exe.dev share port <vmname> <port>`.
This updates the proxy target while keeping the current visibility setting
(private by default).

## Private vs Public Proxies

By default, only users with access to the VM can access the HTTP proxy. Users
accessing https://vmname.exe.xyz/ for the first time will be redirected to log
into `exe.dev`.

To share your site publicly, run `ssh exe.dev share set-public <vmname>`.
Return it to private access with `ssh exe.dev share set-private <vmname>`.

To use exe.dev authentication in your application, see [Login with exe.dev](./login-with-exe).

## Reverse proxy headers

Requests proxied by exe.dev include standard `X-Forwarded-*` headers so your
application can reconstruct the original public request information:

- `X-Forwarded-Proto`: `https` when the client connected over TLS, otherwise `http`
- `X-Forwarded-Host`: The full host header (including port) that the client requested
- `X-Forwarded-For`: A comma-separated list containing any prior `X-Forwarded-For` value plus the client's IP as seen by exe.dev

## Additional Ports

The proxy transparently forwards ports between 3000 and 9999.

For example, if you are serving on port 3456 on your VM,
you can access that at https://vmname.exe.xyz:3456/.

You may only mark a single port public (with the `share set-public` and `share
port` commands); these alternate ports can only be accessed by users with access
to the VM.


---

# Sharing

**2. Features**

*share it like it's hot*


You can share your VM's HTTP port (see [the http proxy documentation](./proxy))
with your friends. There are three mechanisms:

1. Make the HTTP proxy public with `share set-public <vm>`. To point the proxy
   at a different port inside the VM, run `share port <vm> <port>` first.
   Marking it public lets anyone access the server without logging in.

2. Add specific e-mail addresses using `share add <vm> <email>`. This will
send the recipient an e-mail. They can then log into exe.dev with that e-mail,
and access `https://vmname.exe.xyz/`.

3. Create a share link with `share add-link <vm>`. The generated
link will allow anyone access to the page, after they register and login.
Revoking the link (which can be done with the `remove-link` command)
does not revoke their access, but you can remove users who are already
part of the share using `share remove <vm> <email>`.

When you share a VM, users will see your email address.


---

# Custom Domains

**2. Features**

*Use your own domain with exe.dev*


Point your own domain at your exe.dev VM. TLS certificates are issued automatically.
You'll need to visit your DNS provider's configuration to update these.

## Subdomains (CNAME)

For non-apex domains like `app.example.com`, create a CNAME record:

```
app.example.com  CNAME  vmname.exe.xyz
```

## Apex Domains (ALIAS + CNAME)

For apex domains like `example.com`, you need two DNS records:

1. **ALIAS** (or ANAME) record on the apex pointing to `exe.xyz`:
   ```
   example.com  ALIAS  exe.xyz
   ```

2. **CNAME** record on `www` pointing to your VM:
   ```
   www.example.com  CNAME  vmname.exe.xyz
   ```

---

# Login with exe

**2. Features**

*Use exe.dev's authentication system in your applications*


You can leverage exe.dev's authentication system to identify users accessing
your services through the [HTTP proxy](./proxy). This lets you build
authorization without managing passwords or e-mails yourself.

The "Login with exe" feature is complementary with [Sharing](./sharing).
If a site is public, all users can access it, and the developer
can implement their own authorization, including bouncing users through
the /\_\_exe.dev/login to require an e-mail address. Private sites always
have the authentication headers, because the site must have been shared
to be accessed.

## Authentication Headers

When a user is authenticated via exe.dev, the following headers are added to
requests coming into your VM:

- `X-ExeDev-UserID`: A stable, unique user identifier
- `X-ExeDev-Email`: The user's email address

These headers are only present when the user is authenticated. If your proxy
is public, unauthenticated requests will not have these headers.

## Special Authentication URLs

The following special URLs are available for authentication flows:

- **Login**: `https://vmname.exe.xyz/__exe.dev/login?redirect={path}`

  Redirects the user to log in, then returns them to the specified path.

- **Logout**: POST `https://vmname.exe.xyz/__exe.dev/logout`

  Logs the user out, removing the cookie for your domain.

## Development

If you're using an agent to develop on your exe.dev VM itself, your
server might be listening, for example, on http://localhost:8000/, and
nothing is providing these headers. Use an http proxy to add the
headers for testing. For example:

```
mitmdump \
  --mode reverse:http://localhost:8000 \
  --listen-port 3000 \
  --set modify_headers='/~q/X-Exedev-Email/user@example.com' \
  --set modify_headers='/~q/X-Exedev-Userid/usr1234'
```

## Example: nginx authorization

The following `nginx` configuration allows only specified email addresses to access a protected location:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        # Check if X-ExeDev-Email header matches allowed addresses
        set $allowed "false";
        if ($http_x_exedev_email = "alice@example.com") {
            set $allowed "true";
        }
        if ($http_x_exedev_email = "bob@example.com") {
            set $allowed "true";
        }

        # Return 403 if not allowed
        if ($allowed = "false") {
            return 403 "Access denied. Please log in with an authorized account.";
        }

        # Serve content for authorized users
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```


---

# API

**2. Features**

*Programmatic access via SSH*


The exe.dev API is SSH. Run commands like `ssh exe.dev ls --json` or `ssh exe.dev new --json`
directly from scripts and automation.

For example:

```
$ssh exe.dev ls --json | jq '.vms[0]'
{
  "image": "boldsoftware/exeuntu",
  "ssh_dest": "bloggy.exe.xyz",
  "status": "running",
  "vm_name": "bloggy"
}
```


---

# What is Shelley?

**3. Shelley**

*Our coding agent*


Shelley is a coding agent. It is web-based, works on mobile, and, when you
start an `exe.dev` VM with the default `exeuntu` image, it is running on port
9999, and you can access it securely at `https://vmname.exe.xyz:9999/`.

You can ask Shelley to install software (e.g., run a Marimo notebook on port
8000), build a web site, browse the web, and anything in between. That said,
you don't have to use Shelley if you don't want to. Other coding agents run
just fine on `exe.dev` VMs and some are pre-installed on our default image.
If you want, disable it with `sudo systemctl disable --now shelley.service`.

Shelley is so named because the main tool it uses is the shell, and I like
putting "-ey" at the end of words. It is also named after Percy Bysshe Shelley,
with an appropriately ironic nod at
"[Ozymandias](https://www.poetryfoundation.org/poems/46565/ozymandias)."
Shelley is a computer program, and, it's an it.


---

# AGENTS.md

**3. Shelley**

*Guidance files for Shelley*


Shelley reads guidance files, specifically:
* personal `AGENTS.md` file at `~/.config/shelley/AGENTS.md`
* project `AGENTS.md` files in the git root or working directory

Shelley will also notice `CLAUDE.md` and `DEAR_LLM.md` files.


---

# Upgrading Shelley

**3. Shelley**

*Keep Shelley up to date*


Since Shelley is running on your VM, you're running the version that
existed when you created your VM. Run `shelley install <vm>` in
the exe.dev shell to update it.


---

# What is the host key for exe.dev?

**4. FAQ**

*How to verify you're connecting to exe.dev*


When you first `ssh exe.dev` you are looking for the fingerprint:

```
SHA256:JJOP/lwiBGOMilfONPWZCXUrfK154cnJFXcqlsi6lPo.
```

Ensuring that fingerprint is displayed the first time means that
and all future connections from that device are going directly
to `exe.dev`.


---

# How do I use a specific SSH key for exe.dev?

**4. FAQ**

*Configure SSH to use a specific key*


If you want to specify which key to use, use `ssh -i ~/.ssh/id_ed25519_exe exe.dev` or add the following stanza to your `~/.ssh/config`:

```
Host exe.dev
  IdentitiesOnly yes
  IdentityFile ~/.ssh/id_ed25519_exe
```


---

# How do I connect VSCode to my VM?

**4. FAQ**

*Open your VM in VSCode*


On your dashboard, at [https://exe.dev/](https://exe.dev/), there are links
to open in VSCode. This leverages VSCode's SSH remote features.
The link is of the form:

```
vscode://vscode-remote/ssh-remote+<vmname>.exe.xyz/home/exedev?windowId=_blank
```

The `/home/exedev` in that URL is the path on the filesystem for VSCode to
consider as your workspace.


---

# How do I copy files to/from my VM?

**4. FAQ**

*Transfer files with scp*


Use `scp`. For example, `scp <local-file> <vmname>.exe.xyz:`.


---

# Can I run docker images?

**4. FAQ**

*Running Docker on exe.dev VMs*


Sure, why not; it's just a VM. If you start with the `exeuntu` image,
you can run `docker run --rm alpine:latest echo hello`, and go from there!


---

# How do you pronounce "exe"?

**4. FAQ**

*The official pronunciation*


We pronounce it "EX-ee". But you don't have to.


---

# How do I access GitHub? How do I set up a minimal GitHub token?

**4. FAQ**

*GitHub access and fine-grained tokens*


You can use the `gh` tool to login to GitHub on your VM, and it will
work fine.

If you want to give the VM only access to one repo, and perhaps make
that access read-only, you can use [create a fine-grained personal access token](https://github.com/settings/personal-access-tokens/new).
Choose a single repository, and add the "Contents" permission. Choose read-only or
read-write as your use case desires.

<img width="100%" src="https://boldsoftware.github.io/public_html/ghpat.png">

After doing so, use the token like so:

```
$ cat > token
(paste the token and hit ctrl-d)
$ gh auth login --with-token < token
$ gh auth setup-git
$ git clone https://github.com/USER/REPO
```


---

# How does exe.dev work?

**4. FAQ**

*behind-the-scenes look*


You're an engineer. We're engineers. Let's talk about what's going on under the
hood.

An "exe.dev" VM runs on a bare metal machine that exe.dev rents. We happen to
use Cloud Hypervisor, but that's a bit of an implementation detail (and may
change!).

With most providers, your VM starts with a "base image" and is given a block
device. Exe.dev instead starts with a container image (by default, "exeuntu"),
and hooks it up with a block device with the image on it. This makes creating a
new VM take about two seconds. In exchange, we lose some flexibility: you don't
get to choose which kernel you're using.

On the networking side, we don't give your VM its own public IP.
Instead, we terminate HTTPS/TLS requests, and proxy them securely
to your VM's web servers. For SSH, we handle `ssh vmname.exe.xyz`.


---

# Intro

**5. Use Cases**

*an open source reactive notebook*


The use cases in this section are recipes to set up common
software on an `exe.dev` VM. Since creating a new VM is as
simple as `ssh exe.dev new`, trying them out is easy.

We also recommend using your preferred coding agent (or,
Shelley, the one built into our default image) to
give this a shot, and produce a script to reproduce itself.


---

# Running Agents

**5. Use Cases**

*use exe.dev VMs as a sandbox*


When you create a VM with `ssh exe.dev new`, both `claude` and `codex` are pre-installed,
as well as the Shelley agent at `https://vmname.exe.xyz:9999/`.

Use the agent to do research, build prototypes, install other software, and so
on.


---

# Running a self-hosted GitHub Actions Runner

**5. Use Cases**

*log in easily into your CI environment*


There's very little to it; you're following the GitHub instructions, but then
doing a little bit of systemd work to make sure the runner keeps running.

First, create a new VM with `ssh exe.dev new`. This will create
a new VM. SSH into it with `ssh vmname.exe.xyz`. The trickiest
bit is to find the GitHub URLs. Replace the placeholders in the following:

 * [https://github.com/organizations/ORG/settings/actions/runners/new?arch=x64&os=linux](https://github.com/organizations/ORG/settings/actions/runners/new?arch=x64&os=linux)
 * [https://github.com/USER/REPO/settings/actions/runners/new?arch=x64&os=linux](https://github.com/USER/REPO/settings/actions/runners/new?arch=x64&os=linux)

Copy and paste the instructions from GitHub's instructions into your shell
session. It's pretty quick and easy until "run.sh".

To make sure the runner restarts after a reboot, we can create
a systemd service:

Create the service file at `/home/exedev/actions-runner/gh-actions-runner.service`:

```bash
cat > /home/exedev/actions-runner/gh-actions-runner.service << 'EOF'
[Unit]
Description=GitHub Actions Runner
After=network.target

[Service]
Type=simple
User=exedev
WorkingDirectory=/home/exedev/actions-runner
ExecStart=/home/exedev/actions-runner/run.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

Then copy the service file to systemd directory

```bash
sudo cp /home/exedev/actions-runner/gh-actions-runner.service /etc/systemd/system/
```

And start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gh-actions-runner.service
```

Verify the service is running

```bash
sudo systemctl status gh-actions-runner.service

gh-actions-runner.service - GitHub Actions Runner
     Loaded: loaded (/etc/systemd/system/gh-actions-runner.service; enabled; preset: enabled)
     Active: active (running) since Sun 2025-11-09 04:33:28 UTC; 41s ago
   Main PID: 1151 (run.sh)
      Tasks: 15 (limit: 2384)
     Memory: 93.2M (peak: 101.6M)
        CPU: 1.447s
     CGroup: /system.slice/gh-actions-runner.service
             /bin/bash /home/exedev/actions-runner/run.sh
             /bin/bash /home/exedev/actions-runner/run-helper.sh
             /home/exedev/actions-runner/bin/Runner.Listener run

Nov 09 04:33:30 ...exe.dev run.sh[1159]: Connected to GitHub
Nov 09 04:33:31 ...exe.dev run.sh[1159]: Current runner version: '2.329.0'
Nov 09 04:33:31 ...exe.dev run.sh[1159]: 2025-11-09 04:33:31Z: Listening for Jobs
```

You're all set!


---

# Spinning up a Marimo Notebook

**5. Use Cases**

*an open source reactive notebook*


*tl;dr:* `ssh exe.dev new --image=ghcr.io/marimo-team/marimo:latest-sql`

<img width="100%" src="https://boldsoftware.github.io/public_html/marimo.png">

[Marimo](https://marimo.io/) is a reactive Python notebook. To run it on exe.dev, register
for exe.dev with `ssh exe.dev`, and then run
`ssh exe.dev new --image=ghcr.io/marimo-team/marimo:latest-sql` in your terminal.
It'll look like so:

```
$ ssh exe.dev new --image=ghcr.io/marimo-team/marimo:latest-sql
Creating nan-tango using image marimo-team/marimo:latest-sql...

App (HTTPS proxy → :8080)
https://nan-tango.exe.xyz

SSH
ssh nan-tango.exe.xyz
```

Finally, follow the `https://vmname.exe.xyz/` provided. You're all set.
When you're done, `ssh exe.dev rm <vm-name>` to clean up.


---

# Persistent disks, not serverless

**6. Editorials**

*exe.dev is serverful, not serverless*


Most serverless Platform-as-a-Service offerings don't give you a persistent disk.
This is a productivity killer.

At exe.dev, your VM comes with a normal, boring file system. Run a database
on it. Write logs to it. Use sqlite. Store files.

Immutable infrastructure has its place, but it's not the only way to go.


---

# Put your agent in a VM and let it be

**6. Editorials**

*Agent security is unsolved; a virtual machine is pragmatic*


exe.dev is a great place to run a coding agent securely, with minimal
supervision. Each exe.dev VM has little access to your data (see below), except
for the data that you put in it, so there's very little to exfiltrate.

As such, install your coding agent of choice, and let it do its thing, whether
that be to build you a web site (that you can access directly using our HTTPS proxy)
or take some screenshots or do some math or prototype some software.


---

# The GUTS Stack

**6. Editorials**

*Go, Unix, TypeScript, SQLite*


If you use our default `exeuntu` image and our Shelley coding agent, you'll
start with a GUTS template: the "welcome" server we wrote is implemented in Go
and uses SQLite as its database. (At time of writing, we haven't built out much UI,
so the TypeScript is rather minimal; coming soon.) If you don't
specify an alternative, Shelley will build on that architecture, and we think
you'll have good, performant results.

Whether your VM is running a sandbox or prod, we believe this simpler
stack makes sense. Websites are inherently distributed systems (the client is a browser),
but a single, simple back end can scale for a long time. Modern
machines are fast and disks are big. (exe.dev disks are persisted and backed up.)

Kubernetes, serverless functions, distributed transactions, edge computing, and
so on all have their place, but we place our bets on the humble monolith.


---

# Help & Community

**7. Other**

*Join our Discord*


Join our [Discord](https://discord.gg/jc9WQUfaxf) community.


---

# Privacy Notice

**7. Other**

*How exe.dev handles your data*


**Last Updated**: 2026-01-01

This Privacy Notice explains how Bold Software, Inc. (“**exe.dev**”)
collects, uses, discloses, and otherwise processes personal data in
connection with any specific product, service, or application that
references or links to this Privacy Notice.

This Privacy Notice does not address our privacy practices relating to
exe.dev job applicants, employees and other employment-related
individuals, nor data that is not subject to applicable data protection
laws (such as deidentified or publicly available information in certain
jurisdictions). This Privacy Notice is also not a contract and does not
create any legal rights or obligations not otherwise provided by law.

**Our Role in Processing Personal Data**

Data protection laws sometimes differentiate between “controllers” and
“processors” of personal data. A “controller” determines the purposes
and means (the why and how) of processing personal data. A “processor,”
which is sometimes referred to as a “service provider,” processes
personal data on behalf of a controller subject to the controller’s
instructions.

This Privacy Notice describes our privacy practices where we are acting
as the controller of personal data. However, this Privacy Notice does
not cover or address how our customers may process personal data when
they use our services, or how we may process personal data on their
behalf in accordance with their instructions where we are acting as
their processor. As a result, we recommend referring to the privacy
notice of the customer with which you have a relationship for
information on how they engage processors, like us, to process personal
data on their behalf. In addition, we are generally not permitted to
respond to individual requests relating to personal data we process on
behalf of our customers, so we recommend directing any requests to the
relevant customer.

**Our Collection and Use of Personal Data**

The categories of personal data we collect depend on how you interact
with us and our services. For example, you may provide us your personal
data directly when you sign up for our mailing list, register for an
account or otherwise contact us or interact with us.

We also collect personal data automatically when you interact with our
websites and other services and may also collect personal data from
other sources and third parties.

**Personal Data Provided by Individuals**

We collect the following categories of personal data individuals provide
us:

- **Contact Information,** including first and last name, phone number,
  email address, mailing address, and communication preferences. We use
  this information primarily to fulfill your request or transaction, to
  communicate with you directly, and to send you marketing
  communications in accordance with your preferences.

- **Account Information**, including first and last name, email address,
  phone number, account credentials or one-time passcodes, and the
  products or services you are interested in, purchased, or have
  otherwise used. We use this information primarily to administer your
  account, provide you with our products and services, communicate with
  you regarding your account and your use of our products and services,
  and for customer support purposes.

- **Payment Information**, including payment card information, billing
  address, and other financial information (such as, routing and account
  number). Please note that we use third-party payment providers,
  including Stripe, to process payments made to us. We do not retain any
  personally identifiable financial information, such as payment card
  number, you provide these third-party payment providers in connection
  with payments. Rather, all such information is provided directly by
  you to our third-party payment providers. The payment provider’s use
  of your personal data is governed by their privacy notice. To view
  Stripe’s privacy policy, please click
  [here](https://stripe.com/privacy).

- **Feedback and Support Information**, including the contents of
  custom messages sent through the forms, chat platforms, including our
  online live chat or automated chat functions, email addresses, or
  other contact information we make available to customers, as well as
  recordings of calls with us, where permitted by law (including through
  the use of automated or artificial intelligence tools provided by us
  or our third-party providers). We use this information primarily to
  investigate and respond to your inquiries, to communicate with you via
  online chat, email, phone, text message or social media, and to
  improve our products and services.

**Personal Data Automatically Collected**

We, and our third-party partners, automatically collect information you
provide to us and information about how you access and use our products
and services when you engage with us. We typically collect this
information through the use of a variety of our own and our third-party
partners’ automatic data collection technologies, including (i) cookies
or small data files that are stored on an individual’s computer and (ii)
other, related technologies, such as web beacons, pixels, embedded
scripts, mobile SDKs, location-identifying technologies and logging
technologies. Information we collect automatically about you may be
combined with other personal data we collect directly from you or
receive from other sources.

We, and our third-party partners, use automatic data collection
technologies to automatically collect the following data when you use
our services or otherwise engage with us:

- **Information About Your Device and Network**, including the device
  type, manufacturer, and model, operating system, IP address, browser
  type, Internet service provider, and unique identifiers associated
  with you, your device, or your network (including, for example, a
  persistent device identifier or advertising ID). We employ third-party
  technologies designed to allow us to recognize when two or more
  devices are likely being used by the same individual and may leverage
  these technologies (where permitted by law) to link information
  collected from different devices.

- **Information About the Way Individuals Use Our Services and Interact
  With Us**, including the site from which you came, the site to which
  you are going when you leave our services, how frequently you access
  our services, whether you open emails or click the links contained in
  emails, whether you access our services from multiple devices, and
  other browsing behavior and actions you take on our services (such as
  the pages you visit, the content you view, videos you watch, the
  communications you have through our services, and the content, links
  and ads you interact with). We employ third-party technologies
  designed to allow us to collect detailed information about browsing
  behavior and actions that you take on our services, which may record
  your mouse movements, scrolling, and clicks on our services and other
  browsing, search or purchasing behavior. These third-party
  technologies may also record information you enter when you interact
  with our products or services, or engage in chat features or other
  communication platforms we provide.

- **Information About Your Location**, including general geographic
  location that we or our third-party providers may derive from your IP
  address.

All of the information collected automatically through these tools
allows us to improve your experience. For example, we may use this
information to enhance and personalize your user experience, to monitor
and improve our products and services, to offer communications features
such as live and automated chat, and to improve the effectiveness of our
products, services, offers, advertising, communications and customer
service. We may also use this information to: (a) remember information
so that you will not have to re-enter it during your visit or the next
time you visit the site; (b) provide custom, personalized content and
information, including targeted content and advertising; (c) identify
you across multiple devices; (d) provide and monitor the effectiveness
of our services; (e) monitor aggregate metrics such as total number of
visitors, traffic, usage, and demographic patterns on our website; (f)
diagnose or fix technology problems; and (g) otherwise to plan for and
enhance our products and services.

For information about the choices you may have in relation to our use of
automatic data collection technologies, please refer to the Your
Privacy Choices section below.

**Personal Data from Other Sources and Third Parties**

We may receive the same categories of personal data as described above
from the following sources and other parties:

- **Single Sign-On**: We may provide you the ability to log in to our
  services through certain third-party accounts you maintain. When you
  use these single sign-on protocols to access our services, we do not
  receive your login credentials for the relevant third-party service.
  Instead, we receive tokens from the single sign-on protocol to help
  identify you in our system (such as by your username) and confirm you
  successfully authenticated through the single sign-on protocol. This
  information allows us to more easily provide you access to our
  products and services.

- **Mobile Sign-On**: We may provide you the ability to log in to our
  mobile applications or authenticate yourself using facial,
  fingerprint, or other biometric recognition technology available
  through your mobile device. If you choose to utilize these login
  features, information about your facial geometry, your fingerprint, or
  other biometric information will be collected by your mobile device
  for authentication purposes. We do not store or have access to this
  biometric information. Instead, your mobile device will perform the
  biometric authentication process and only let us know whether the
  authentication was successful. If the authentication was successful,
  you will be able to access the applicable mobile application or
  feature without separately providing your credentials. For more
  details, please refer to the biometric authentication guides offered
  by your device provider.

- **Other Customers**: We may receive your personal data from our other
  customers. For example, a customer may provide us with your contact
  information as a part of a referral.

- **Advertisers, Influencers, and Publishers**: We engage in
  advertising both on our services and through third-party services.
  Advertisers, influencers, and publishers may share personal data with
  us in connection with our advertising efforts. For example, we may
  obtain information about whether an advertisement for our services led
  to a successful engagement between you and us.

- **Business Partners**: We may receive your information from our
  business partners, such as companies that offer their products and/or
  services as a part of or in connection with our services. For example,
  certain of our products and services allow our customers to integrate
  third-party services. If you choose to leverage these third-party
  service integrations, we may receive confirmation from our business
  partner regarding whether you are an existing customer of their
  services.

- **Service Providers**: Our service providers that perform services on
  our behalf, such as analytics and certain marketing providers, collect
  personal data and often share some or all of this information with us.
  For example, we receive personal data you may submit in response to
  requests for feedback to our survey providers.

- **Other Sources**: We may also collect personal data about you from
  other sources, including through transactions such as mergers and
  acquisitions.

- **Inferences**: We may generate inferences or predictions about you
  and your interests and preferences based on the other personal data we
  collect and the interactions we have with you.

**Additional Uses of Personal Data**

In addition to the primary purposes for using personal data described
above, we may also use personal data we collect to:

- Fulfill or meet the reason the information was provided, such as to
  fulfill our contractual obligations, to facilitate payment for our
  products and services, or to deliver the services requested;

- Manage our organization and its day-to-day operations;

- Communicate with you, including via email, text message, chat, social
  media and/or telephone calls;

- Facilitate the relationship we have with you and, where applicable,
  the company you represent;

- Request you provide us feedback about our product and service
  offerings;

- Address inquiries or complaints made by or about an individual in
  connection with our products or services;

- Create and maintain accounts for our users;

- Verify your identity and entitlement to our products and services;

- Market our products and services to you, including through email,
  phone, text message, push notification, and social media;

- Administer, improve, and personalize our products and services,
  including by recognizing you and remembering your information when you
  return to our products and services;

- Develop, operate, improve, maintain, protect, and provide the features
  and functionality of our products and services;

- Identify and analyze how you use our products and services;

- Create aggregated or de-identified information that cannot reasonably
  be used to identify you, which information we may use for purposes
  outside the scope of this Privacy Notice;

- Improve and customize our products and services to address the needs
  and interests of our user base and other individuals we interact with;

- Test, enhance, update, and monitor the products and services, or
  diagnose or fix technology problems;

- Help maintain and enhance the safety, security, and integrity of our
  property, products, services, technology, assets, and business;

- Defend, protect, or enforce our rights or applicable contracts and
  agreements (including our [Terms of Service](/docs/terms-of-service)), as well as to
  resolve disputes, to carry out our obligations and enforce our rights,
  and to protect our business interests and the interests and rights of
  third parties;

- Detect, prevent, investigate, or provide notice of security incidents
  or other malicious, deceptive, fraudulent, or illegal activity and
  protect the rights and property of exe.dev and others;

- Facilitate business transactions and reorganizations impacting the
  structure of our business;

- Comply with contractual and legal obligations and requirements;

- Fulfill any other purpose for which you provide your personal data, or
  for which you have otherwise consented.

**Our Disclosure of Personal Data**

We disclose or otherwise make available personal data in the following
ways:

- **To Marketing Providers:** We coordinate and share personal data with
  our marketing providers in order to advertise and communicate with you
  about the products and services we make available.

- **To Ad Networks and Advertising Partners**: We work with third-party
  ad networks and advertising partners to deliver advertising and
  personalized content on our services, on other websites and services,
  and across other devices. These parties may collect information
  automatically from your browser or device when you visit our websites
  and other services through the use of cookies and related
  technologies. This information is used to provide and inform targeted
  advertising, as well as to provide advertising-related services such
  as reporting, attribution, analytics, and market research.

- **To Business Partners**: We may share personal data with our business
  partners, or we may allow our business partners to collect personal
  data directly from you in connection with our services. Our business
  partners may use your personal data for their own business and
  commercial purposes, including to send you information about their
  products and services.

- **To Service Providers:** We engage other third parties to perform
  certain services on our behalf in connection with the uses of personal
  data described in the sections above. Depending on the applicable
  services, these service providers may process personal data on our
  behalf or have access to personal data while performing services on
  our behalf.

- **To Other Businesses as Needed to Provide Services**: We may share
  personal data with third parties you engage with through our services
  or as needed to fulfill a request or transaction including, for
  example, payment processing services.

- **In Connection with a Business Transaction or Reorganization:** We
  may take part in or be involved with a business transaction or
  reorganization, such as a merger, acquisition, joint venture, or
  financing or sale of company assets. We may disclose, transfer, or
  assign personal data to a third party during negotiation of, in
  connection with, or as an asset in such a business transaction or
  reorganization. Also, in the unlikely event of our bankruptcy,
  receivership, or insolvency, your personal data may be disclosed,
  transferred, or assigned to third parties in connection with the
  proceedings or disposition of our assets.

- **To Facilitate Legal Obligations and Rights:** We may disclose
  personal data to third parties, such as legal advisors and law
  enforcement:

  - in connection with the establishment, exercise, or defense of legal
    claims;

  - to comply with laws or to respond to lawful requests and legal
    process;

  - to protect our rights and property and the rights and property of
    our agents, customers, and others, including to enforce our
    agreements, policies, and terms of use;

  - to detect, suppress, or prevent fraud;

  - to reduce credit risk and collect debts owed to us;

  - to protect the health and safety of us, our customers, or any
    person; or

  - as otherwise required by applicable law.

- **With Your Consent or Direction:** We may disclose your personal data
  to certain other third parties or publicly with your consent or
  direction. For example, with your permission, we may post your
  testimonial on our websites.

**Your Privacy Choices**

**Communication Preferences**

- **Email Communication Preferences**: You can stop receiving
  promotional email communications from us by clicking on the
  “unsubscribe” link provided in any of our email communications. Please
  note you cannot opt-out of service-related email communications (such
  as, account verification, transaction confirmation, or service update
  emails).

- **Push Notification Preferences**: You can stop receiving push
  notifications from us by changing your preferences in your device’s
  notification settings menu or in the applicable service-specific
  application. Please note we do not have any control over your device’s
  notifications settings and are not responsible if they do not function
  as intended.

**Withdrawing Your Consent**

Where we have your consent for the processing of your personal data
(e.g., when you opt in to receive certain types of marketing
communications from us), you may withdraw your consent by following the
instructions provided when your consent was requested or by contacting
us as set forth in the Contact Us section below.

**Automatic Data Collection Preferences**

You may be able to utilize third-party tools and features to restrict
our use of automatic data collection technologies. For example, (i) most
browsers allow you to change browser settings to limit automatic data
collection technologies on websites, (ii) most email providers allow you
to prevent the automatic downloading of images in emails that may
contain automatic data collection technologies, and (iii) many devices
allow you to change your device settings to limit automatic data
collection technologies for device applications. Please note that
blocking automatic data collection technologies through third-party
tools and features may negatively impact your experience using our
services, as some features and offerings may not work properly or at
all. Depending on the third-party tool or feature you use, you may not
be able to block all automatic data collection technologies or you may
need to update your preferences on multiple devices or browsers. We do
not have any control over these third-party tools and features and are
not responsible if they do not function as intended.

**Targeted Advertising Preferences**

We engage third parties to help us facilitate targeted advertising
designed to show you personalized ads based on predictions of your
preferences and interests developed using personal data we maintain and
personal data our third-party partners obtain from your activity over
time and across nonaffiliated websites and other services. The data we
and our third-party partners use for purposes of facilitating targeted
advertising, as well as to provide advertising-related services such as
reporting, attribution, analytics, and market research, are primarily
collected through the use of a variety of automatic data collection
technologies, including cookies, web beacons, pixels, embedded scripts,
mobile SDKs, location-identifying technologies and logging technologies.
We may share a common account identifier (such as a hashed email address
or user ID) with our third-party advertising partners to help link the
personal data we and our third-party partners collect to the same
person, or otherwise target advertising to an individual on a
third-party website or platform.

In addition to taking the steps set forth in the Automatic Data
Collection Preferences section above, you may be able to further
exercise control over the advertisements that you see by leveraging one
or more targeted advertising opt-out programs. For example:

- **Device-Specific Opt-Out Programs**: Certain devices provide
  individuals the option to turn off targeted advertising for the entire
  device (such as Apple devices through their App Tracking Transparency
  framework or Android devices through their opt out of ads
  personalization feature). Please refer to your device manufacturer’s
  user guides for additional information about implementing any
  available device-specific targeted advertising opt-outs.

- **Digital Advertising Alliance**: The [Digital Advertising
  Alliance](https://digitaladvertisingalliance.org/) allows individuals
  to opt out of receiving online interest-based targeted advertisements
  from companies that participate in their program. Please follow the
  instructions at <https://optout.aboutads.info/?c=2&lang=EN> for
  browser-based advertising and
  <https://www.youradchoices.com/appchoices> for app-based advertising
  to opt out of targeted advertising carried out by our third-party
  partners and other third parties that participate in the Digital
  Advertising Alliance’s self-regulatory program.

- **Network Advertising Initiative**: The [Network Advertising
  Initiative](https://thenai.org/) also provides individuals
  instructions for further controlling how information is used for
  online advertising. Please follow the instructions at
  <https://thenai.org/how-to-opt-out/> to exercise these controls.

- **Platform-Specific Opt-Out Programs**: Certain third-party platforms
  provide individuals the option to turn off targeted advertising for
  the entire platform (such as certain social media platforms). Please
  refer to your platform provider’s user guides for additional
  information about implementing any available platform-specific
  targeted advertising opt-outs.

Please note that when you opt out of receiving interest-based
advertisements through one of these programs, this does not mean you
will no longer see advertisements from us or on our services.  Instead,
it means that the online ads you do see from relevant program
participants should not be based on your interests. We are not
responsible for the effectiveness of, or compliance with, any third
parties’ opt-out options or programs or the accuracy of their statements
regarding their programs. In addition, program participants may still
use automatic data collection technologies to collect information about
your use of our services, including for analytics and fraud prevention
as well as any other purpose permitted under the applicable advertising
industry program.

**Modifying or Deleting Your Personal Data**

If you have any questions about reviewing, modifying, or deleting your
personal data, you can contact us as set forth in the Contact Us
section below. We may not be able to modify or delete your personal data
in all circumstances.

**Partner-Specific Preferences**

Certain of our third-party providers and partners offer additional ways
that you may exercise control over your personal data, or automatically
impose limitations on the way we can use personal data in connection
with the services they provide:

- **Device-Specific / Platform-Specific Preferences**: The device and/or
  platform you use to interact with us (such as your mobile device or
  social media provider), may provide you additional choices with regard
  to the data you choose to share with us. For example, many mobile
  devices allow you to change your device permissions to prevent our
  products and services from accessing certain types of information from
  your device (such as your contact lists or precise geolocation data),
  and many social media platforms allow you to change your platform
  permissions to prevent integrated products and services from accessing
  certain types of information connected with your profile. Please refer
  to your device or platform provider’s user guides for additional
  information about implementing any available platform-specific
  targeted advertising opt-outs.

**Children’s Personal Data**

Our services are not directed to, and we do not intend to, or knowingly,
collect or solicit personal data from children under the age of 13. If
an individual is under the age of 13, they should not use our services
or otherwise provide us with any personal data either directly or by
other means. If a child under the age of 13 has provided personal data
to us, we encourage the child’s parent or guardian to contact us to
request that we remove the personal data from our systems. If we learn
that any personal data we collect has been provided by a child under the
age of 13, we will promptly delete that personal data.

**Security of Personal Data**

We have implemented reasonable physical, technical, and organizational
safeguards that are designed to protect your personal data. In addition,
we take steps designed to ensure any third party with whom we share
personal data provides a similar level of protection. However, despite
these controls, we cannot completely ensure or warrant the security of
your personal data.

**Third-Party Websites and Services**

Our websites and other services may include links to or redirect you to
third-party websites, plug-ins, applications, or other services.
Third-party websites and other services may also reference or link to
our websites and services. This Privacy Notice does not apply to any
personal data practices of these third-party websites, plug-ins,
applications, or other services. To learn about these third parties’
personal data practices, please visit their respective privacy notices.

**Updates to This Privacy Notice**

We may update this Privacy Notice from time to time. When we make
changes to this Privacy Notice, we will change the date at the beginning
of this Privacy Notice. If we make material changes to this Privacy
Notice, we will notify individuals by email to their registered email
address, by prominent posting on this website or our other platforms, or
through other appropriate communication channels. All changes shall be
effective from the date of publication unless otherwise provided.

**Contact Us**

If you have any questions or requests in connection with this Privacy
Notice or other privacy-related matters, please contact us at:
support@exe.dev.


---

# Terms of Service

**7. Other**

*Terms and conditions for using exe.dev*


**Last Modified**: 2026-01-01

These Terms of Service (these “**Terms**”) describe the terms and
conditions by which you may access and/or use the website(s), including
https://exe.dev, and any and all related software, documentation, and
online, mobile-enabled, and/or digital services (collectively, the
“**Service**”) provided by Bold Software, Inc. (including its successors
and assigns, “**Company**,” “**we**,” “**our**,” or “**us**”). By
accessing and/or using the Service, you’re agreeing to these Terms and
acknowledging that you have read and understood our Privacy Notice. If
you don’t agree to these Terms, you may not use the Service. We reserve
the right to modify these Terms, as described below. These Terms apply
to all visitors and users of the Service, and to all others who access
the Service (collectively, “**Users**,” and, as applicable to you,
“**you**” or “**your**”).

PLEASE READ THESE TERMS CAREFULLY TO ENSURE THAT YOU UNDERSTAND EACH
PROVISION. THESE TERMS CONTAIN A MANDATORY INDIVIDUAL ARBITRATION
PROVISION IN SECTION 14.2 (THE "**ARBITRATION
AGREEMENT**") AND A CLASS ACTION/JURY TRIAL WAIVER PROVISION IN SECTION
14.3 (THE "**CLASS ACTION/JURY TRIAL WAIVER**")
THAT REQUIRE, UNLESS YOU OPT OUT PURSUANT TO THE INSTRUCTIONS IN THE
ARBITRATION AGREEMENT, THE EXCLUSIVE USE OF FINAL AND BINDING
ARBITRATION ON AN INDIVIDUAL BASIS TO RESOLVE DISPUTES BETWEEN YOU AND
US, INCLUDING ANY CLAIMS THAT AROSE OR WERE ASSERTED BEFORE YOU AGREED
TO THESE TERMS. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW (AS
DEFINED BELOW), YOU EXPRESSLY WAIVE YOUR RIGHT TO SEEK RELIEF IN A COURT
OF LAW AND TO HAVE A JURY TRIAL ON YOUR CLAIMS, AS WELL AS YOUR RIGHT TO
PARTICIPATE AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, COLLECTIVE,
PRIVATE ATTORNEY GENERAL, OR REPRESENTATIVE ACTION OR PROCEEDING.

1.  **How We Administer the Service**

    1.  **Eligibility.** This is a contract between you and Company. You
        must read and agree to these Terms before using the Service. You
        may use the Service only if you can form a legally binding
        contract with us, and only in compliance with these Terms and
        all applicable local, state, national, and international laws,
        rules, and regulations (“**Applicable Law**”). To use the
        Service, you must be at least 18 years old (or the age of
        majority in your jurisdiction). The Service is not available to
        any Users we previously removed from the Service.

    2.  **User Accounts**

        1)  Your User Account; Suspension and Termination. Your
            account on the Service (your “**User Account**”) gives you
            access to certain services and functionalities that we may,
            in our sole discretion, establish and maintain as part of
            the Service from time to time. We may, with or without prior
            notice, permanently terminate or temporarily suspend your
            access to your User Account and/or the Service without
            liability and for any or no reason, including if you violate
            any provision of these Terms. Additionally, you may
            deactivate your User Account at any time. We may, with or
            without prior notice, change or stop providing the Service,
            to you or to Users generally, or create usage limits for the
            Service.

        2)  Organizational Accounts. An individual may access
            and/or use the Service on behalf of a company or other
            entity, such as that individual’s employer (such entity, an
            “**Organization**”). In such cases, notwithstanding anything
            to the contrary herein: (a) these Terms are an agreement
            between (i) us and such individual and (ii) us and that
            Organization; (b) “you,” as used in these Terms in the
            context of a license grant, assignment, restriction,
            obligation, acknowledgment, representation, warranty, or
            covenant, or in any similar context, means (i) such
            individual ***and*** (ii) “the Organization, on
            behalf of the Organization and its subsidiaries and
            affiliates, and its and their respective directors,
            officers, employees, contractors, agents, and other
            representatives who access and/or use the Service
            (collectively, “**Org Users**”)”; and “your” has the
            corresponding meanings; (c) such individual represents and
            warrants to having the authority to bind that Organization
            to these Terms (and, in the absence of such authority, such
            individual may not access, nor use, the Service); (d) such
            individual’s acceptance of these Terms will bind that
            Organization to these Terms; (e) we may disclose information
            regarding such individual and such individual’s access to
            and use of the Service to that Organization; (f) such
            individual’s right to access and use the Service may be
            suspended or terminated (and the administration of the
            applicable User Account may be transferred) if such
            individual ceases to be associated with, or ceases to use an
            email address associated with or provisioned by, that
            Organization; (g) that Organization will make all Org Users
            aware of these Terms’ provisions, as applicable to such Org
            Users, and will cause each Org User to comply with such
            provisions; and (h) that Organization will be solely
            responsible and liable for all acts and omissions of the Org
            Users, and any act or omission by any Org User that would
            constitute a breach of these Terms had it been taken by that
            Organization will be deemed a breach of these Terms by that
            Organization. Without limiting the generality of the
            foregoing, if an individual opens a User Account using an
            email address associated with or provisioned by an
            Organization, or if an Organization pays fees due in
            connection with such individual’s access to or use of the
            Service (or reimburses such individual for payment of such
            fees), then we may, in our sole discretion, deem such
            individual to be accessing and using the Service on behalf
            of that Organization.

        3)  Account Security. You may never use another User’s
            User Account without such User’s permission. You are solely
            responsible for the activity that occurs on your User
            Account, you will keep your User Account password(s) and/or
            any other authentication credentials secure, and you will
            not share your password(s) and/or any other authentication
            credentials with anyone else. We encourage you to use
            “strong” passwords (passwords that use a combination of
            upper- and lower-case letters, numbers, and symbols) to
            protect your User Account. Any Org User with
            administrator-level access to your User Account can modify
            your User Account settings, access, and billing information.
            We will not be liable for, and expressly disclaim liability
            for, any losses caused by any unauthorized use of your User
            Account and/or any changes to your User Account. You will
            notify us immediately of any breach of security or
            unauthorized use of your User Account.

        4)  Account Settings. You may control certain aspects of
            your User Account and any associated User profile, and of
            the way you interact with the Service, by changing the
            settings in your settings page. By providing us with your
            email address, you consent to our using that email address
            to send you Service-related notices. If we send you
            marketing-related emails, you may opt out of receiving them
            or change your preferences by contacting the Service support
            team at support@exe.dev or by clicking on the “unsubscribe”
            link within a marketing email. Opting out will not prevent
            you from receiving Service-related notices.

    3.  **Your Interactions with Other Users.**
        YOU ARE SOLELY RESPONSIBLE FOR YOUR
        INTERACTIONS, INCLUDING SHARING OF INFORMATION, WITH OTHER
        USERS. WE RESERVE THE RIGHT TO MONITOR DISPUTES BETWEEN YOU AND
        OTHER USERS. WE EXPRESSLY DISCLAIM ALL LIABILITY ARISING FROM
        YOUR INTERACTIONS WITH OTHER USERS, AND FOR ANY USER'S ACTION OR
        INACTION, INCLUDING RELATING TO USER CONTENT (AS DEFINED
        BELOW).

2.  **Access to the Service; Service Restrictions**

    1.  **Access to the Service.** Subject to your compliance with these
        Terms and any documentation we may make available to you, you
        are hereby granted a non-exclusive, limited, non-transferable,
        and freely revocable right to access and use the Service, solely
        for your personal use or internal business purposes, as
        permitted by the features of the Service. We reserve all rights
        not expressly granted herein in and to the Service.
        Notwithstanding anything to the contrary herein, certain
        portions of the Service may be available only during the
        Subscription Term(s) (as defined below), as further described in
        Section 6.4 (Subscription Plans).

    2.  **Restrictions and Acceptable Use.** Except to the extent a
        restriction is prohibited by Applicable Law, you will not do,
        and will not enable any third party to do, any of the following:

        1)  disassemble, reverse engineer, decode, or decompile any part
            of the Service or license or resell or modify any part of
            the Service;

        2)  use any automated or non-automated means to access the
            Service for “scraping” (except that public search engines
            may use spiders to create searchable indices of public
            materials, only as specified in the robots.txt file);

        3)  use the Service to disable, override, or otherwise interfere
            with any Company-implemented communications to end users,
            consent screens, user settings, alerts, warning, or the
            like;

        4)  impose an unreasonable or disproportionately large load on
            Company infrastructure, including without limitation
            intentionally uploading excessive amounts of data or
            otherwise abusing the Service in a manner that degrades
            performance for others, especially for the purpose of
            evading payment or financial obligations;

        5)  use the Service for cryptocurrency mining or other
            unauthorized commercial purposes;

        6)  use the Service in any manner that impacts the stability of
            the servers or the operation or performance of the Service
            or any User’s use of the Service;

        7)  copy, rent, lease, sell, loan, transfer, assign, sublicense,
            resell, distribute, modify, alter, or create derivative
            works of any part of the Service or any of our intellectual
            property;

        8)  use the Service in any manner that (i) violates any
            Applicable Law, contractual obligation, or right of any
            person, (ii) is fraudulent, false, deceptive, or defamatory,
            (iii) promotes hatred, violence, or harm against, or
            (iv) otherwise may be harmful or objectionable to us or any
            other third party;

        9)  use the Service in competition with us, to develop competing
            products or services, for benchmarking or competitive
            analysis of the Service, or otherwise to our detriment or
            disadvantage;

        10) bypass the measures we may use to prevent or restrict access
            to the Service;

        11) use the Service to transmit spam or other unsolicited email
            (and we may immediately remove any content that we believe
            to be spam) or use the Service for commercial solicitation;

        12) access any content available on or via the Service through
            any technology or means other than those provided by the
            Service or authorized by us;

        13) attempt to interfere with, compromise the system integrity
            or security of, or decipher any transmissions to or from,
            the servers running the Service;

        14) transmit invalid data, viruses, worms, or other software
            agents through the Service;

        15) collect or harvest any personal information from the
            Service; or

        16) refer to us or to the Service in a manner that could imply a
            relationship that involves endorsement, affiliation, or
            sponsorship between you (or a third party) and us without
            our consent.

3.  **User Content**

    1.  As between us and you, you (or your licensors) will own any and
        all information, data, and other content that is collected or
        otherwise received by us from you through the Service (“**User
        Content**”).

    2.  We claim no ownership rights over User Content, and, as between
        you and us, all User Content that is submitted, posted,
        displayed, provided, shared, or otherwise made available on or
        via the Service by you is and will remain yours. We have the
        right (but not the obligation) in our sole discretion to remove
        any of your User Content that is shared via the Service. You
        grant, and you represent and warrant that you have all rights
        necessary to grant, to us, under all of your intellectual
        property rights, a non-exclusive and royalty-free right and
        license to use, copy, store, modify, distribute, reproduce, and
        display your User Content and Output: (i) to maintain and
        provide the Service; (ii) to exercise our rights and enforce our
        obligations under these Terms; and (iii) to perform such other
        actions authorized by you in connection with your use of the
        Service.

    3.  You affirm, represent, and warrant the following: (a) you have
        obtained, and are solely responsible for obtaining, all consents
        required by Applicable Law to provide User Content relating to
        third parties; (b) your User Content and Output and our use
        thereof as contemplated by these Terms and the Service will not
        violate any Applicable Law or infringe any rights of any third
        party, including, but not limited to, any intellectual property
        rights, privacy rights and confidentiality rights; (c) you will
        not upload or make available through the Service, either
        directly or by other means, any personal information of children
        under 13 or the applicable age of digital consent; and (d) your
        User Content does not include sexually suggestive content; hate
        speech or direct attacks on an individual or group; content that
        is abusive, harassing, defamatory, vulgar, libelous, or invasive
        of another’s privacy; sexist or racially, ethnically, or
        otherwise discriminatory content; content that contains
        self-harm or excessive violence; impostor profiles; content in
        furtherance of harmful or illegal activities; malicious programs
        or code; any person’s personal information without such person’s
        consent; spam messages; and/or otherwise objectionable content.

    4.  You own your User Content and we claim no ownership rights over
        your user content. We take no responsibility and assume no
        liability for any user content. You will be solely responsible
        for your user content and the consequences of submitting,
        posting, displaying, providing, sharing, or otherwise making it
        available on or through the service, and you understand and
        acknowledge that we are acting only as a passive conduit for
        your online distribution and publication of your user content.
        WE TAKE NO RESPONSIBILITY AND ASSUME NO LIABILITY FOR ANY USER
        CONTENT. YOU WILL BE SOLELY RESPONSIBLE FOR YOUR USER CONTENT
        AND THE CONSEQUENCES OF SUBMITTING, POSTING, DISPLAYING,
        PROVIDING, SHARING, OR OTHERWISE MAKING IT AVAILABLE ON OR
        THROUGH THE SERVICE, AND YOU UNDERSTAND AND ACKNOWLEDGE THAT WE
        ARE ACTING ONLY AS A PASSIVE CONDUIT FOR YOUR ONLINE
        DISTRIBUTION AND PUBLICATION OF YOUR USER CONTENT. YOU
        UNDERSTAND AND ACKNOWLEDGE THAT THE SERVICE MAY EXPOSE YOU TO
        CONTENT THAT IS INACCURATE, OBJECTIONABLE, INAPPROPRIATE FOR
        CHILDREN, OR OTHERWISE UNSUITED TO YOUR PURPOSE, AND YOU
        UNDERSTAND AND ACKNOWLEDGE THAT WE WILL NOT BE LIABLE FOR ANY
        DAMAGES YOU ALLEGE TO INCUR AS A RESULT OF OR RELATING TO ANY
        CONTENT ACCESSED ON OR THROUGH THE SERVICE.

4.  **Intellectual Property**

    1.  **Company Intellectual Property.** You understand and
        acknowledge that we (or our licensors (including other Users),
        as applicable) own and will continue to own all rights
        (including intellectual property rights), title, and interest in
        and to the Service, all materials and content displayed or
        otherwise made available on and/or through the Service
        (excluding your User Content), and all software, algorithms,
        code, technology, and intellectual property underlying and/or
        included in or with the Service. Use of any intellectual
        property for any purpose not expressly permitted by these Terms
        is strictly prohibited.

    2.  **Generated Content.** You may be allowed to submit text,
        documents, images and other materials to the Services for
        processing, and receive output from the Services based on such
        materials (“**Output**”). Due to the nature of machine learning,
        use of the service may result in incorrect Output. You must
        evaluate the accuracy of any Output as appropriate for your use
        case, including by using human review of the output. You agree
        that we shall not be liable for any damages you or any third
        party alleges to incur as a result of or relating to any Output
        or other content generated by or accessed on or through the
        service.

    3.  **Usage Data.** We may collect, or you may provide to us,
        diagnostic, technical, usage, and/or related information,
        including information about your computers, mobile devices,
        systems, and software (collectively, “**Usage Data**”). All
        Usage Data is and will be owned solely and exclusively by us,
        and, to the extent any ownership rights in or to the Usage Data
        vest in you, you hereby assign to us all rights (including
        intellectual property rights), title, and interest in and to
        same. Accordingly, we may use, maintain, and/or process the
        Usage Data or any portion thereof for any lawful purpose,
        including, without limitation: (a) to provide and maintain the
        Service; (b) to improve our products and services (including the
        Service), and to develop new products, services, and/or
        features; (c) to monitor your usage of the Service; (d) for
        research and analytics, including, without limitation, data
        analysis, identifying usage trends, and/or customer research;
        and (e) to share analytics and other derived Usage Data with
        third parties, solely in de-identified or aggregated form. The
        Service may contain technological measures designed to prevent
        unauthorized or illegal use of the Service; you understand and
        acknowledge that we may use these and other lawful measures to
        verify your compliance with these Terms and to enforce our
        rights, including intellectual property rights, in and to the
        Service.

    4.  **Open Source Software**. Some software used in our Service may
        be offered under an open source license that we make available
        to you. There may be provisions in an open source license that
        expressly override some of these terms, so please be sure to
        read those licenses.

    5.  **Feedback.** To the extent you provide us any suggestions,
        recommendations, or other feedback relating to the Service or to
        any other Company products or services (collectively,
        “**Feedback**”), you hereby assign to us all rights (including
        intellectual property rights), title, and interest in and to the
        Feedback, without providing any attribution or compensation to
        you or to any third party. Please treat Feedback as our
        Confidential Information (as defined below).

5.  **Confidential Information**

The Service may include non-public, proprietary, or confidential
information of Company and/or of other Users (“**Confidential
Information**”). Confidential Information includes any information that
should reasonably be understood to be confidential given the nature of
the information and the circumstances of disclosure, including
non-public business, product, technology, and marketing information. You
will: (a) protect and safeguard the confidentiality of all Confidential
Information with at least the same degree of care as you would use
protect your own highly sensitive confidential information, but in no
event with less than a reasonable degree of care; (b) not use any
Confidential Information for any purpose other than to exercise your
rights, or to perform your obligations, under these Terms; and (c) not
disclose any Confidential Information to any person or entity, except
your service providers or financial or legal advisors who/that (i) need
to know the Confidential Information and (ii) are bound by non-use and
non-disclosure restrictions at least as restrictive as those set forth
in this Section.

6.  **Payments, Billing, and Subscription Plans**

    1.  **Billing Policies; Taxes.** Certain aspects of the Service may
        be provided for free, while certain other aspects of the Service
        may be provided for a fee (“**Fee**”). Each Fee (including each
        Subscription Fee (as defined below)) is the sum of the
        applicable Company Fee (as defined below) and any applicable
        Third-Party Fees (as defined below). By electing to use non-free
        aspects of the Service, including enrolling in Subscription(s)
        (as defined below), you agree to the pricing and payment terms
        applicable to you, as may be made available on our website
        (including without limitation at <https://exe.dev/docs/pricing>)
        or via your User Account, and as incorporated by reference
        herein. We may add new products and/or services for additional
        Fees, add or amend Fees for existing products and/or services,
        and/or discontinue offering any Subscriptions at any time;
        provided, however, that if we have agreed to a specific
        Subscription Term and a corresponding Subscription Fee, then
        that Subscription will remain in force for that Subscription Fee
        during that Subscription Term. Any change to our pricing and
        payment terms will become effective in the billing cycle
        following our provision of notice of such change. Except as may
        be expressly stated in these Terms, all Fees must be paid in
        advance, payment obligations are non-cancelable once incurred
        (subject to any cancellation rights set forth in these Terms),
        and Fees paid are non-refundable. Fees are stated exclusive of
        any taxes, levies or duties (collectively, but, for clarity,
        excluding taxes based on our net income, “**Taxes**”). You will
        be responsible for paying all Taxes associated with your
        purchases and/or Subscriptions in connection with the Service.

    2.  **Definitions**

        1)  “**Company Fee**” means the portion of the Fee (including
            any Subscription Fee) that Company may retain as
            consideration for providing the Service or any portion
            thereof (including any particular Subscription), as
            applicable.

        2)  “**Subscription**” means a particular portion of the Service
            that is available on an automatically renewing subscription
            basis, and your access thereto, as applicable.

        3)  “**Subscription Fee**” means the recurring amount due as
            consideration for a Subscription.

        4)  “**Third-Party Fees**” means the portion of the Fee
            (including any Subscription Fee) retained by one (1) or more
            third parties, including Payment Processor, that we may
            engage from time to time, in our sole discretion.

        5)  “**Payment Processors**” means the third-party payment
            processors which we engage to process payments Users make in
            connection with the Service.

    3.  **Your Payment Method**

        1)  General. To use non-free aspects of the Service, you
            must provide us with at least one (1)  valid payment card
            that is accepted by us and Payment Processor (each such
            card, a “**Payment Method**”). By providing a Payment
            Method, you authorize each of Company and Payment Processor
            to charge that Payment Method the applicable Fees and Taxes,
            including, if applicable, on a recurring basis until you
            cancel your Subscription (including any notice period
            specified in the Cancellation Procedures section below).
            Fees and Taxes will be charged to your Payment Method on the
            specific payment date indicated in your User Account. The
            length of your billing cycle will depend on the type of
            Subscription in which you are enrolled, if applicable. We
            may authorize your Payment Method in anticipation of
            Service-related charges through various methods.

        2)  Third-Party Payment Processor. We or Payment
            Processor will attempt to verify your Payment Method(s), and
            may do so by processing an authorization hold, which is
            standard practice. To the extent Payment Processor processes
            payments made by you, you will be subject to terms and
            conditions governing the use of Payment Processor’s service.
            Please review such terms and conditions as well as Payment
            Processor’s privacy notice (each of which is available on
            Payment Processor’s website). You acknowledge and understand
            that Payment Processor may collect and retain Third-Party
            Fees whenever you pay Fees (including Subscription Fees).
            Payment must be received by Payment Processor before our
            acceptance of an order. For all payments, Payment Processor
            will collect your Payment Method details and charge your
            chosen Payment Method in connection with an order. If any of
            your account, order, or Payment Method information changes,
            you will promptly update such information, so that we or
            Payment Processor may complete your transaction(s) and/or
            contact you, as needed. By using our Service, you agree to
            be bound by the Services Agreement of Stripe, one of our
            Payment Processors, available at
            https://stripe.com/us/legal.

        3)  Payment Representations and Warranties. You represent
            and warrant that: (i) the account, order, and Payment Method
            information you supply to us and/or to Payment Processor, as
            applicable, is true, accurate, correct, and complete;
            (ii) you are duly authorized to use the Payment Method(s);
            (iii) you will pay any and all charges incurred by users of
            your Payment Method in connection with the Service,
            including any applicable Fees (at the prices in effect when
            such charges are incurred) and Taxes; (iv) charges incurred
            by you will be honored by your Payment Method company;
            (v) you will not allow or enable anyone else to use your
            Subscription (including, without limitation, by sharing your
            password(s) or any other authentication credentials with
            anyone else, or by attempting to transfer your Subscription
            to anyone else); and (vi) you will report to us any
            unauthorized or prohibited access to or use of your
            Subscription and/or password(s) or other authentication
            credentials.

        4)  Disclaimer. WE DISCLAIM ANY AND ALL LIABILITY WITH
            RESPECT TO, AND YOU UNDERSTAND AND ACKNOWLEDGE THAT WE ARE
            NOT RESPONSIBLE FOR: (I) ANY SECURITY OR PRIVACY BREACHES
            RELATED TO YOUR CREDIT CARD OR OTHER PAYMENT METHOD, (II)
            ANY FEES THAT MAY BE CHARGED TO YOU BY YOUR BANK IN
            CONNECTION WITH THE COLLECTION OF FEES, AND/OR (III) ANY
            UNAUTHORIZED USE OF YOUR CREDIT CARD, DEBIT CARD, OR OTHER
            PAYMENT METHOD BY A THIRD PARTY.

    4.  **Subscription Plans**

        1)  Automatic Renewals. Subscriptions are available on an
            automatically renewing subscription basis and entail payment
            of Subscription Fees. YOUR SUBSCRIPTION WILL AUTOMATICALLY
            RENEW AT THE END OF EACH SUBSCRIPTION TERM IDENTIFIED IN
            YOUR ACCOUNT FOR SUBSEQUENT TERMS EQUAL IN LENGTH TO THAT
            INITIAL SUBSCRIPTION TERM (EACH SUCH PERIOD, A
            “**SUBSCRIPTION TERM**”) UNLESS AND UNTIL YOU CANCEL THE
            APPLICABLE SUBSCRIPTION IN ACCORDANCE WITH THE CANCELLATION
            PROCEDURES IDENTIFIED BELOW. YOU UNDERSTAND THAT UNLESS AND
            UNTIL YOU NOTIFY US OF YOUR INTENT TO CANCEL, YOUR
            SUBSCRIPTION AND THE CORRESPONDING SUBSCRIPTION FEE WILL
            AUTOMATICALLY RENEW, AND YOU AUTHORIZE EACH OF Company AND
            PAYMENT PROCESSOR (WITHOUT NOTICE TO YOU, UNLESS REQUIRED BY
            APPLICABLE LAW) TO CHARGE YOU THE APPLICABLE SUBSCRIPTION
            FEE AND ANY APPLICABLE TAXES, USING ANY OF YOUR PAYMENT
            METHODS.

        2)  Automatic Billing and Policies. When you enroll in a
            Subscription, you expressly acknowledge and agree that:
            (i) each of Company and Payment Processor is authorized to
            charge you, at the beginning of each Subscription Term, the
            Subscription Fee for the applicable Subscription, any
            applicable Taxes, and any other charges you may incur in
            connection with such Subscription, subject to adjustment in
            accordance with these Terms; and (ii) your Subscription is
            continuous until the earlier of: (A) your cancellation of
            such Subscription (including any notice period specified in
            the Cancellation Procedures section below) and (B) the
            suspension, discontinuation, or termination of your access
            to such Subscription or to the Service in accordance with
            these Terms. You understand and acknowledge that the amounts
            billed may vary due to Promotional Offers (as defined
            below), changes to the Subscription Fee in accordance with
            the payment terms set forth via the Service, and/or changes
            in applicable Taxes, and you authorize each of Company and
            Payment Processor to charge your Payment Method the changed
            amounts.

        3)  Cancellation Procedures. To cancel any Subscription,
            you must notify us before the start of the next Subscription
            Term by using the appropriate functionalities of the
            Service, including through the same method you used to sign
            up (for example, if you signed up online, you may cancel
            online through your User Account settings), or by contacting
            us at support@exe.dev. You will continue to have access to
            the Subscription through the end of the then-current
            Subscription Term. You understand that unless and until you
            notify us of your intent to cancel, your subscription and
            the corresponding subscription fee will automatically renew,
            and you authorize each of COMPANY and payment processor
            (without notice to you, unless required by applicable law)
            to charge you the applicable subscription fee and any
            applicable taxes, using any of your payment methods.

        4)  Cancellation; Refunds. You may de-activate your User
            Account or any Subscription at any time and we may suspend
            or terminate your Subscription, your User Account, or the
            Service at any time, in our sole discretion. HOWEVER, YOU
            UNDERSTAND AND ACKNOWLEDGE THAT, UNLESS REQUIRED BY
            APPLICABLE LAW, YOU WILL NOT BE ENTITLED TO RECEIVE ANY
            REFUND OR CREDIT FOR ANY SUCH CANCELLATION, SUSPENSION, OR
            TERMINATION, NOR FOR ANY UNUSED TIME ON YOUR SUBSCRIPTION,
            ANY PRE-PAYMENTS MADE IN CONNECTION WITH YOUR SUBSCRIPTION,
            ANY USAGE OR SUBSCRIPTION FEES FOR ANY PORTION OF THE
            SERVICE, ANY CONTENT OR DATA ASSOCIATED WITH YOUR USER
            ACCOUNT, OR ANYTHING ELSE, AND THAT ANY SUCH REFUNDS OR
            CREDITS MAY BE GRANTED AT OUR SOLE OPTION AND IN OUR SOLE
            DISCRETION. If you believe you have been improperly charged
            and would like to request a refund, please contact us at
            support@exe.dev.

        5)  Free Trials. We may, at our sole option and in our
            sole discretion, offer free trials to a particular portion
            of the Service, subject to the terms of the offer. If you
            are signed up to such a free trial, we or Payment Processor
            will automatically bill your Payment Method on the day that
            follows the last day of your free trial (which day will be
            the first day of your first Subscription Term), and on the
            first day of each subsequent Subscription Term, subject to
            these Terms. If you wish to avoid charges to your Payment
            Method, you must cancel your free trial by 11:59 PM Eastern
            Time on the last day of your free trial period, using the
            same method you used to sign up or any other method we make
            available to you. If you cancel your free trial while it is
            ongoing, your access to the applicable portion of the
            Service may be terminated immediately upon such
            cancellation.

    5.  **Promotional Offers.** We may from time to time offer special
        promotional offers, plans, or memberships (“**Promotional
        Offers**”). Promotional Offer eligibility is determined by us in
        our sole discretion, and we reserve the right to revoke a
        Promotional Offer in the event that we determine you are not
        eligible. We may use information such as device ID, method of
        payment, and/or an email address used in connection with your
        User Account to determine eligibility. The eligibility
        requirements and other limitations and conditions will be
        disclosed when you sign-up for the Promotional Offer or in other
        communications made available to you. You understand and
        acknowledge that any Promotional Offers, including, without
        limitation, relating to Subscriptions, are subject to change at
        any time and from time to time.

7.  **Privacy; Data Security**

    1.  **Privacy.** We care about your privacy. To provide and enhance
        the Service, we may need to be able to identify you and your
        interests, and we use your personal data to do this. By using
        the Service, you acknowledge that we may collect, use, and
        disclose your personal information and aggregated and/or
        anonymized data as set forth in our Privacy Notice, and that
        your personal information may be transferred to, and/or
        processed in, the United States.

    2.  **Security.** We care about the integrity and security of your
        personal information. However, we cannot guarantee that
        unauthorized third parties will never be able to defeat our
        security measures or to use your data for improper purposes. You
        acknowledge that you provide your data at your own risk.

8.  **Text Messaging and Calls**

    1.  **General.** You may provide us with your telephone number as
        part of creating your User Account or otherwise. By providing a
        telephone number, you consent to receiving autodialed or
        prerecorded calls and/or text messages from us, or on our
        behalf, at such telephone number. We may place such calls or
        send such texts to (a) help keep your User Account secure
        through the use of multi-factor authentication (“**MFA**”);
        (b) help you access your User Account if you are experiencing
        difficulties; and/or (c) as otherwise necessary to service your
        account or enforce these Terms, our policies, Applicable Law, or
        any other agreement we may have with you. Part of the MFA
        identity-verification process may involve Company sending text
        messages containing security codes to the telephone number you
        provided, and you agree to receive such texts from or on behalf
        of Company.

    2.  **Consent to Transactional Communications.** You expressly
        consent and agree to Company contacting you using written,
        electronic, and/or verbal means, including manual dialing,
        emails, prerecorded/artificial voice messages, and/or using an
        automatic telephone dialing system to call or text your
        mobile/cellular telephone number, as necessary to complete
        transactions requested by you and to service your account, and
        as permitted by Applicable Law, in each case even if the phone
        number is registered on any United States federal and/or state
        Do-Not-Call/Do-Not-email registry/ies. Message and data rates
        apply. For purposes of clarity, the text messages described in
        this paragraph are transactional text messages, not promotional
        text messages.

    3.  **Consent to Promotional Messages.** Additionally, we offer you
        the chance to enroll to receive recurring SMS/text messages from
        Company. You may enroll to receive text messages about
        account-related news and alerts and/or Promotional Offers
        (including cart reminders) and marketing related to Company
        products and/or services. By enrolling in Company’s SMS/text
        messaging service, you agree to receive text messages from
        Company to the mobile phone number provided by you, and you
        certify that such mobile number is true and accurate and that
        you are authorized to enroll such mobile number to receive such
        texts. You acknowledge and agree that the texts may be sent
        using an automatic telephone dialing system and that message and
        data rates apply. Check your mobile plan and contact your
        wireless provider for details. You are solely responsible for
        all charges related to SMS/text messages, including charges from
        your wireless provider. Message frequency varies. Consent is not
        required as a condition of purchase. To the extent permitted by
        Applicable Law, we are not responsible for any delays upon
        sending or receiving text messages.

    4.  **Unsubscribing From Promotional Messages.** You may opt out
        from promotional text messages at any time. To unsubscribe from
        promotional text messages, text or reply “STOP,” “QUIT,” “END,”
        “CANCEL,” or “UNSUBSCRIBE” to the number from which you received
        the text from the mobile device receiving the messages, or to
        the other phone number provided by Company (if any) for such
        purpose. You consent that following such a request to
        unsubscribe, you may receive one (1) final text message from or
        on behalf of Company confirming your request. For help, please
        contact us at support@exe.dev.

9.  **Your Use of Third-Party Services**

The service may contain links to third-party sites, materials, and/or
services (collectively, “**Third-Party Services**”) that are not owned
or controlled by us, and certain functionalities of the service may
require your use of third-party services, to which you are subject to
and agree to the third party’s terms and conditions made available via
its services. We do not endorse or assume any responsibility for any
third-party services. If you access a third-party service from the
service or share your user content OR OUTPUT on or through any
third-party service, you do so at your own risk, and you understand that
these terms and our privacy notice do not apply to your use of any
third-party service. You expressly relieve us from any and all liability
arising from your access to and/or use of any third-party service.
Additionally, your dealings with, or participation in promotions of,
advertisers found on the service are solely between you and such
advertisers. You understand and acknowledge that we will not be
responsible for any loss or damage of any sort relating to your dealings
with such advertisers.

10. **Release**

    You hereby release us from all claims, damages (whether direct,
    indirect, incidental, consequential, or otherwise), obligations,
    losses, liabilities, costs, debts, and expenses, in each case of
    every kind and nature, known and unknown, arising out of a dispute
    between you and a third party (including any other User) in
    connection with the Service. In addition, you waive any Applicable
    Law that says, in substance: “a general release does not extend to
    claims which the releasing party does not know or suspect to exist
    in his or her favor at the time of executing the release, which, if
    known by him or her, would have materially affected his or her
    settlement with the released party.”

11. **Indemnity**

You will defend, indemnify, and hold us and our subsidiaries and
affiliates, and our and their respective agents, suppliers, licensors,
employees, contractors, officers, and directors (collectively, including
Company, the “**Company Indemnitees**”) harmless from and against any
and all claims, damages (whether direct, indirect, incidental,
consequential, or otherwise), obligations, losses, liabilities, costs,
debts, and expenses (including, but not limited to, legal fees) arising
from: (a) your access to and/or use of the Service, including your use
of Output; (b) your violation of any term of these Terms; (c) your
violation of any third-party right, including, without limitation, any
privacy right or intellectual property right; (d) your violation of any
Applicable Law; (e) User Content or any content that is submitted via
your User Account; (f) your willful misconduct; or (g) any third party’s
access to and/or use of the Service with your authentication
credential(s).

12. **No Warranty; Disclaimers**

The service is provided on an “as is” and “as available” basis. To the
maximum extent permitted by applicable law, the service, the
intellectual property, and any other information available on or through
the service are provided without warranties of any kind, whether express
or implied, including, but not limited to, implied warranties of
merchantability, fitness for a particular purpose, and/or
non-infringement. NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN,
OBTAINED BY YOU FROM US OR THROUGH THE SERVICE WILL CREATE ANY WARRANTY
NOT EXPRESSLY STATED HEREIN. WITHOUT LIMITING THE GENERALITY OF THE
FOREGOING, NONE OF THE Company INDEMNITEES WARRANTS THAT ANY CONTENT OR
ANY OTHER INFORMATION CONTAINED IN, OR AVAILABLE VIA, THE SERVICE IS
ACCURATE, COMPREHENSIVE, RELIABLE, USEFUL, OR CORRECT; THAT THE SERVICE
WILL MEET YOUR REQUIREMENTS; THAT THE SERVICE WILL BE AVAILABLE AT ANY
PARTICULAR TIME OR LOCATION, UNINTERRUPTED, OR SECURE; THAT ANY DEFECTS
OR ERRORS IN THE SERVICE WILL BE CORRECTED; OR THAT THE SERVICE IS FREE
OF VIRUSES OR OTHER HARMFUL COMPONENTS. ANY CONTENT DOWNLOADED OR
OTHERWISE OBTAINED THROUGH THE USE OF THE SERVICE IS SO OBTAINED AT YOUR
OWN RISK, AND YOU WILL BE SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR
COMPUTER SYSTEM(S) OR MOBILE DEVICE(S) AND/OR FOR LOSS OF DATA THAT
RESULTS FROM SAME OR FROM YOUR ACCESS TO AND/OR USE OF THE SERVICE. YOU
MAY HAVE OTHER STATUTORY RIGHTS, BUT THE DURATION OF STATUTORILY
REQUIRED WARRANTIES, IF ANY, WILL BE LIMITED TO THE SHORTEST PERIOD
PERMITTED BY APPLICABLE LAW.

Further, Company does not warrant, endorse, guarantee, recommend, or
assume responsibility for any product or service advertised or offered
by any third party through the service or any hyperlinked website or
service, and Company will not be a party to, or in any way monitor, any
transaction between you and third-party providers of products or
services.

13. **Limitation of Liability**

To the maximum extent permitted by applicable law, in no event will any
Company indemnitee be liable for any indirect, punitive, incidental,
special, consequential, or exemplary damages, including, without
limitation, damages for loss of profits, goodwill, use, or data, or
other intangible losses, arising out of or relating to the use of, or
inability to use, the service or any portion thereof. Under no
circumstances will we be responsible for any damage, loss, or injury
resulting from hacking, tampering, or other unauthorized access to or
use of the service or your user account or the information contained
therein. In no event will any Company indemnitee be liable to you for
any claims, proceedings, liabilities, obligations, damages, losses, or
costs in an amount exceeding the amount you paid to us hereunder or one
hundred U.S. Dollars ($100.00), whichever is greater. THIS LIMITATION
OF LIABILITY SECTION APPLIES WHETHER THE ALLEGED LIABILITY IS BASED ON
CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR ANY OTHER BASIS, EVEN
IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE ASSUME NO
LIABILITY OR RESPONSIBILITY FOR ANY (A) ERRORS, MISTAKES, OR
INACCURACIES OF CONTENT; (B) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY
NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO OR USE OF THE SERVICE;
(C) ANY UNAUTHORIZED ACCESS TO OR USE OF THE SERVERS RUNNING THE SERVICE
AND/OR ANY AND ALL PERSONAL INFORMATION STORED THEREIN; (D) ANY
INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICE; (E)
ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO
OR THROUGH THE SERVICE BY ANY THIRD PARTY; (F) ANY ERRORS OR OMISSIONS
IN ANY CONTENT, OR ANY LOSS OR DAMAGE INCURRED AS A RESULT OF THE USE OF
ANY CONTENT POSTED, EMAILED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE
THROUGH THE SERVICE; AND/OR (G) YOUR DATA, ANY USER CONTENT, OR THE
DEFAMATORY, OFFENSIVE, OR ILLEGAL CONDUCT OF ANY THIRD PARTY.

The disclaimers, exclusions, and limitations of liability under these
terms will not apply to the extent prohibited by applicable law.

14. **Governing Law, Arbitration, and Class Action/Jury Trial
    Waiver**

    1.  **Governing Law.** These Terms will be governed by the laws of
        the State of California, without respect to its conflict of laws
        principles. Notwithstanding the preceding sentences with respect
        to the substantive law governing these Terms, the Federal
        Arbitration Act (9 U.S.C. §§ 1-16) (as it may be amended,
        “**FAA**”) governs the interpretation and enforcement of the
        Arbitration Agreement below and preempts all state laws (and
        laws of other jurisdictions) to the fullest extent permitted by
        Applicable Law. If the FAA is found to not apply to any issue
        that arises from or relates to the Arbitration Agreement, then
        that issue will be resolved under and governed by the law of the
        U.S. state where you live (if applicable) or the jurisdiction
        mutually agreed upon in writing by you and us. The application
        of the United Nations Convention on Contracts for the
        International Sale of Goods is expressly excluded. You agree to
        submit to the exclusive personal jurisdiction of the federal and
        state courts located in California for any actions for which we
        retain the right to seek injunctive or other equitable relief in
        a court of competent jurisdiction to prevent the actual or
        threatened infringement, misappropriation, or violation of our
        data security, Confidential Information, or intellectual
        property rights, as set forth in the Arbitration Agreement
        below, including any provisional relief required to prevent
        irreparable harm. You agree that California is the proper and
        exclusive forum for any appeals of an arbitration award, or for
        trial court proceedings in the event that the Arbitration
        Agreement below is found to be unenforceable. These Terms were
        drafted in the English language and this English language
        version of the Terms is the original, governing instrument of
        the understanding between you and us. In the event of any
        conflict between the English version of these Terms and any
        translation, the English version will prevail.

    2.  **Arbitration Agreement**

        1)  General. READ THIS SECTION CAREFULLY BECAUSE IT
            REQUIRES THE PARTIES TO ARBITRATE THEIR DISPUTES AND LIMITS
            THE MANNER IN WHICH YOU CAN SEEK RELIEF FROM US. This
            Arbitration Agreement applies to and governs any dispute,
            controversy, or claim between you and us that arises out of
            or relates to, directly or indirectly: (i) these Terms;
            (ii) access to or use of the Service, including receipt of
            any advertising or marketing communications; (iii) any
            transactions through, by, or using the Service; or (iv) any
            other aspect of your relationship or transactions with us as
            a User or consumer (each, a “**Claim**,” and, collectively,
            “**Claims**”). This Arbitration Agreement will apply,
            without limitation, to all Claims that arose or were
            asserted before or after your consent to these Terms.

        2)  Opting Out of Arbitration Agreement. If you are a new
            User, you can reject and opt out of this Arbitration
            Agreement within thirty (30) days of accepting these Terms
            by emailing us at support@exe.dev with your full, legal name
            and stating your intent to opt out of this Arbitration
            Agreement. Opting out of this Arbitration Agreement does not
            affect the binding nature of any other part of these Terms,
            including the provisions regarding controlling law or the
            courts in which any disputes must be brought.

        3)  Dispute-Resolution Process. For any Claim, you will
            first contact us at support@exe.dev and attempt to resolve
            the Claim with us informally. In the unlikely event that we
            have not been able to resolve a Claim after sixty (60) days,
            we each agree to resolve such Claim exclusively through
            binding arbitration by JAMS before a single arbitrator (the
            “**Arbitrator**”), under the Optional Expedited Arbitration
            Procedures then in effect for JAMS (the “**Rules**”), except
            as provided herein. JAMS may be contacted at
            [www.jamsadr.com](http://www.jamsadr.com/), where the
            Rules are available. In the event of any conflict between
            the Rules and this Arbitration Agreement, this Arbitration
            Agreement will control. The arbitration will be conducted in
            the U.S. county where you live (if applicable) or Alameda
            County, California, unless you and Company agree otherwise.
            If you are using the Service for commercial purposes, each
            party will be responsible for paying any JAMS filing and
            administrative fees and Arbitrator fees in accordance with
            the Rules, and the award rendered by the Arbitrator will
            include costs of arbitration, reasonable attorneys’ fees,
            and reasonable costs for expert and other witnesses. If you
            are an individual using the Service for non-commercial
            purposes: (i) JAMS may require you to pay a fee for the
            initiation of your case, unless you apply for and
            successfully obtain a fee waiver from JAMS; (ii) the award
            rendered by the Arbitrator may include your costs of
            arbitration, your reasonable attorneys’ fees, and your
            reasonable costs for expert and other witnesses; and
            (iii) you may sue in a small claims court of competent
            jurisdiction without first engaging in arbitration, but this
            would not absolve you of your commitment to engage in the
            informal dispute resolution process. Any judgment on the
            award rendered by the Arbitrator may be entered in any court
            of competent jurisdiction. You and we agree that the
            Arbitrator, and not any federal, state, or local court or
            agency, will have exclusive authority to resolve any
            disputes relating to the scope, interpretation,
            applicability, enforceability, or formation of this
            Arbitration Agreement, including any claim that all or any
            part of this Arbitration Agreement is void or voidable. The
            Arbitrator will also be responsible for determining all
            threshold arbitrability issues, including issues relating to
            whether these Terms are, or whether any provision of these
            Terms is, unconscionable or illusory, and any defense to
            arbitration, including waiver, delay, laches,
            unconscionability, and/or estoppel.

        4)  Equitable Relief. NOTHING IN THIS ARBITRATION
            AGREEMENT WILL BE DEEMED AS: PREVENTING US FROM SEEKING
            INJUNCTIVE OR OTHER EQUITABLE RELIEF FROM THE COURTS AS
            NECESSARY TO PREVENT THE ACTUAL OR THREATENED INFRINGEMENT,
            MISAPPROPRIATION, OR VIOLATION OF OUR DATA SECURITY,
            CONFIDENTIAL INFORMATION, OR INTELLECTUAL PROPERTY RIGHTS;
            OR PREVENTING YOU FROM ASSERTING CLAIMS IN A SMALL CLAIMS
            COURT, PROVIDED THAT YOUR CLAIMS QUALIFY AND SO LONG AS THE
            MATTER REMAINS IN SUCH COURT AND ADVANCES ON ONLY AN
            INDIVIDUAL (NON-CLASS, NON-COLLECTIVE, AND
            NON-REPRESENTATIVE) BASIS.

        5)  Severability. If this Arbitration Agreement is found
            to be void, unenforceable, or unlawful, in whole or in part,
            the void, unenforceable, or unlawful provision, in whole or
            in part, will be severed. Severance of the void,
            unenforceable, or unlawful provision, in whole or in part,
            will have no impact on the remaining provisions of this
            Arbitration Agreement, which will remain in force, or on the
            parties’ ability to compel arbitration of any remaining
            Claims on an individual basis pursuant to this Arbitration
            Agreement. Notwithstanding the foregoing, if the Class
            Action/Jury Trial Waiver below is found to be void,
            unenforceable, or unlawful, in whole or in part, because it
            would prevent you from seeking public injunctive relief,
            then any dispute regarding the entitlement to such relief
            (and only that relief) must be severed from arbitration and
            may be litigated in a civil court of competent jurisdiction.
            All other claims for relief subject to arbitration under
            this Arbitration Agreement will be arbitrated under its
            terms, and the parties agree that litigation of any dispute
            regarding the entitlement to public injunctive relief will
            be stayed pending the outcome of any individual claims in
            arbitration.

    3.  **Class Action/Jury Trial Waiver.** BY ENTERING INTO THESE TERMS, YOU
        AND Company ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO
        BRING, JOIN, OR PARTICIPATE IN ANY PURPORTED CLASS ACTION,
        COLLECTIVE ACTION, PRIVATE ATTORNEY GENERAL ACTION, OR OTHER
        REPRESENTATIVE PROCEEDING OF ANY KIND AS A PLAINTIFF OR CLASS
        MEMBER. THE FOREGOING APPLIES TO ALL USERS (BOTH NATURAL PERSONS
        AND ENTITIES), REGARDLESS OF WHETHER YOU HAVE OBTAINED OR USED
        THE SERVICE FOR PERSONAL, COMMERCIAL, OR OTHER PURPOSES. THIS
        CLASS ACTION/JURY TRIAL WAIVER APPLIES TO CLASS ARBITRATION,
        AND, UNLESS WE AGREE OTHERWISE, THE ARBITRATOR MAY NOT
        CONSOLIDATE MORE THAN ONE PERSON’S OR ENTITY’S CLAIMS. YOU AND
        Company AGREE THAT THE ARBITRATOR MAY AWARD RELIEF ONLY TO AN
        INDIVIDUAL CLAIMANT AND ONLY TO THE EXTENT NECESSARY TO PROVIDE
        RELIEF ON YOUR INDIVIDUAL CLAIM(S). ANY RELIEF AWARDED MAY NOT
        AFFECT OTHER USERS.

15. **U.S. Government Restricted Rights**

To the extent the Service is being used by or on behalf of the U.S.
Government, the Service will be deemed commercial computer software or
commercial computer software documentation (as applicable). Accordingly,
if you are an agency of the U.S. Government or any contractor therefor,
you receive only those rights with respect to the Service as are granted
to all other Users hereunder, in accordance with 48 C.F.R. §227.7202 and
48 C.F.R. §12.212, as applicable.

16. **Export Controls**

You understand and acknowledge that the Service may be subject to export
control laws and regulations. You will comply with all applicable import
and export and re-export control and trade and economic sanctions laws
and regulations, including the Export Administration Regulations
maintained by the U.S. Department of Commerce, trade and economic
sanctions maintained by the U.S. Treasury Department’s Office of Foreign
Assets Control (“**OFAC**”), and the International Traffic in Arms
Regulations maintained by the U.S. State Department. You represent and
warrant that you are not, and that no person to whom you make the
Service available or that is acting on your behalf, or, if you are an
Organization, that no person or entity owning 50% or more of your equity
securities or other equivalent voting interests, is (a) listed on the
List of Specially Designated Nationals and Blocked Persons or on any
other list of sanctioned, prohibited, or restricted parties administered
by OFAC or by any other governmental entity, or (b) located in, a
national or resident of, or a segment of the government of, any country
or territory for which the United States maintains trade or economic
sanctions or embargoes or that has been designated by the U.S.
Government as a “terrorist supporting” region.

17. **General Provisions**

    1.  **Assignment.** These Terms, and any rights and licenses granted
        hereunder, may not be transferred or assigned by you without our
        prior express written consent, but may be assigned by us without
        restriction. Any attempted transfer or assignment in violation
        hereof will be null and void.

    2.  **Notification Procedures and Changes to these Terms.** We may
        provide notifications to you via email notice or through posting
        of such notice on the Service, as we determine in our sole
        discretion. We may modify or update these Terms from time to
        time, and you should review this page periodically. These Terms
        apply to and govern your access to and use of the Service
        effective as of the start of your access to the Service, even if
        such access began before publication of these Terms. Your
        continued use of the Service after any change to these Terms
        constitutes your acceptance of the new Terms of Service. If you
        do not agree to any part of these Terms or to any future Terms
        of Service, do not access or use (or continue to access or use)
        the Service.

    3.  **Entire Agreement; Severability.** These Terms, together with
        any amendments and any additional agreements you may enter into
        with us in connection with the Service, will constitute the
        entire agreement between you and us concerning the Service.
        Except as otherwise stated in the Arbitration Agreement, if any
        provision of these Terms is deemed invalid by a court of
        competent jurisdiction, the invalidity of such provision will
        not affect the validity of the remaining provisions of these
        Terms, which will remain in full force and effect.

    4.  **No Waiver.** No waiver of any term of these Terms will be
        deemed a further or continuing waiver of such term or of any
        other term, and our failure to assert any right or provision
        under these Terms will not constitute a waiver of such right or
        provision.

    5.  **California Residents.** The provider of the Service is Bold
        Software Inc, 43 Slater Ln, Berkeley, CA 94705. If you are a California
        resident, in accordance with Cal. Civ. Code §1789.3, you may
        report complaints to the Complaint Assistance Unit of the
        Division of Consumer Services of the California Department of
        Consumer Affairs by contacting it in writing at 1625 North
        Market Blvd., Suite N 112 Sacramento, CA 95834, or by telephone
        at (800) 952-5210 or (916) 445-1254.

    6.  **Contact.** If you have any questions about these Terms and/or
        the Service, please contact us at support@exe.dev.


---

# help

**8. CLI Reference**

*Show help information*


# help

Show help information



---

# doc

**8. CLI Reference**

*Browse documentation*


# doc

Browse documentation

## Usage

```
doc [slug]
```



---

# ls

**8. CLI Reference**

*List your VMs*


# ls

List your VMs

## Usage

```
ls
```

## Options

- `--json`: output in JSON format



---

# new

**8. CLI Reference**

*Create a new VM*


# new

Create a new VM

## Options

- `--command`: container command: auto, none, or a custom command
- `--env`: environment variable in KEY=VALUE format (can be specified multiple times)
- `--image`: container image
- `--json`: output in JSON format
- `--name`: VM name (auto-generated if not specified)
- `--no-email`: do not send email notification
- `--prompt`: initial prompt to send to Shelley after VM creation (requires exeuntu image)

## Examples

```
new                                     # just give me a computer
new --name=b --image=ubuntu:22.04       # custom image and name
new --env FOO=bar --env BAZ=qux         # with environment variables
```



---

# rm

**8. CLI Reference**

*Delete a VM*


# rm

Delete a VM

## Usage

```
rm <vmname>
```

## Options

- `--json`: output in JSON format



---

# restart

**8. CLI Reference**

*Restart a VM*


# restart

Restart a VM

## Usage

```
restart <vmname>
```

## Options

- `--json`: output in JSON format



---

# share

**8. CLI Reference**

*Share HTTPS VM access with others*


# share

Share HTTPS VM access with others

## Usage

```
share <subcommand> <vm> [args...]
```

## Options

- `--json`: output in JSON format

## Subcommands

### share show

Show current shares for a VM

**Usage:**
```
share show <vm>
```

**Options:**
- `--json`: output in JSON format
- `--qr`: show QR code for the URL

### share port

Set the HTTP proxy port for a VM

**Usage:**
```
share port <vm> [port]
```

**Options:**
- `--json`: output in JSON format

**Examples:**
```
share port mybox 8080
```

### share set-public

Make the HTTP proxy publicly accessible

**Usage:**
```
share set-public <vm>
```

**Options:**
- `--json`: output in JSON format

### share set-private

Restrict the HTTP proxy to authenticated users

**Usage:**
```
share set-private <vm>
```

**Options:**
- `--json`: output in JSON format

### share add

Share VM with a user via email

**Usage:**
```
share add <vm> <email> [--message='...']
```

**Options:**
- `--json`: output in JSON format
- `--message`: message to include in share invitation
- `--qr`: show QR code for the share URL

**Examples:**
```
share add mybox user@example.com
share add mybox user@example.com --message='Check this out'
```

### share remove

Revoke a user's access to a VM

**Usage:**
```
share remove <vm> <email>
```

**Options:**
- `--json`: output in JSON format

### share add-link

Create a shareable link for a VM

**Usage:**
```
share add-link <vm>
```

**Aliases:** add-share-link

**Options:**
- `--json`: output in JSON format
- `--qr`: show QR code for the URL

### share remove-link

Revoke a shareable link

**Usage:**
```
share remove-link <vm> <token>
```

**Aliases:** remove-share-link

**Options:**
- `--json`: output in JSON format



---

# whoami

**8. CLI Reference**

*Show your user information including email and all SSH keys.*


# whoami

Show your user information including email and all SSH keys.

## Usage

```
whoami
```

## Options

- `--json`: output in JSON format



---

# ssh-key

**8. CLI Reference**

*Manage SSH keys for your account*


# ssh-key

Manage SSH keys for your account

## Usage

```
ssh-key <subcommand> [args...]
```

## Options

- `--json`: output in JSON format

## Subcommands

### ssh-key list

List all SSH keys associated with your account

**Usage:**
```
ssh-key list
```

**Options:**
- `--json`: output in JSON format

### ssh-key add

Add a new SSH key to your account

**Usage:**
```
ssh-key add <public-key>
```

**Options:**
- `--json`: output in JSON format

**Examples:**
```
ssh-key add 'ssh-ed25519 AAAA... user@host'

To generate a new key locally:
  ssh-keygen -t ed25519 -f ~/.ssh/id_exe

Then add the public key from your local shell:
  ssh exe.dev ssh-key add "\"$(cat ~/.ssh/id_exe.pub)\""

Or from the exe.dev shell:
  ssh-key add 'ssh-ed25519 AAAA... user@host'
```

### ssh-key remove

Remove an SSH key from your account

**Usage:**
```
ssh-key remove <public-key>
```

**Options:**
- `--json`: output in JSON format



---

# shelley

**8. CLI Reference**

*Manage Shelley agent on VMs*


# shelley

Manage Shelley agent on VMs

## Usage

```
shelley <subcommand> [args...]
```

## Subcommands

### shelley install

Install or upgrade Shelley to the current version

**Usage:**
```
shelley install <vm>
```



---

# ssh

**8. CLI Reference**

*SSH into a VM*


# ssh

SSH into a VM

## Usage

```
ssh <vmname> [command...]
```



---

# browser

**8. CLI Reference**

*Generate a magic link to log in to the website*


# browser

Generate a magic link to log in to the website

## Usage

```
browser
```

## Options

- `--json`: output in JSON format
- `--qr`: show QR code for the URL



---

# exit

**8. CLI Reference**

*Exit*


# exit

Exit

