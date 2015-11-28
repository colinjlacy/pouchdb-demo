# PouchDB Demo

This is a demo application based on the two tutorials by Nic Raboy for [creating a CEAN-stack application](https://blog.nraboy.com/2015/10/create-a-full-stack-app-using-node-js-couchbase-server/), and [using PouchDB to store and sync data locally](http://blog.couchbase.com/sync-with-couchbase-using-only-angularjs-and-pouchdb).  This project takes the extra step not covered either of those tutorials, which is to create a fully vertical sync between the client and a Couchbase Server instance, using PouchDB. This extends my [CEAN stack](https://github.com/colinjlacy/CEAN-stack-demo) application, which simply stores to the Couchbase Server db, but doesn't enable syncing.

## Setup

### Create an instance of Couchbase Server

The bulk of setup comes in installing and configuring Couchbase Server.  

First, follow the instructions on [the Couchbase website](http://www.couchbase.com/get-started-developing-nosql#Download_Couchbase_Server), which will guide you through downloading, installing, and configuring.  Once you've done that, launch the DB admin portal in the browser by navigating to [http://localhost:8091/](http://localhost:8091/). 

Next, create a bucket called **restful-sample**.  If you'd like to call it something else, that's fine, just be sure to configure that field in the `/config.json` file. 
 
#### Create an Index on the Bucket

After that you'll have to add an index.  There's probably an easier way to do this, but here's how I did it, as per the instructions in the tutorial.

Start up the **Couchbase Query Client** from the command line.  For me, one a Mac, this meant running the following:
 
	$ /Applications/Couchbase\ Server.app/Contents/Resources/couchbase-core/bin/cbq
	
According to Nic Raboy, on a PC you would run:

	C:/Program Files/Couchbase/Server/bin/cbq.exe
	
Keep in mind I haven't tested that Windows shell command.

Once your Couchbase console has started, run the following command to create an index:

	CREATE PRIMARY INDEX ON `restful-sample` USING GSI;

### Download the Sync Gateway

Couchbase provides the **Couchbase Sync Gateway**, a shell process (which might be originally written in Go?) that handles syncing a local DB instance (in this case PouchDB) to a Couchbase Server instance.

Again, I'm sure there's an easier way to do this, but this is how I got there.  To download, navigate your browser to the [Downloads page](http://www.couchbase.com/nosql-databases/downloads) on the Couchbase website.  Click on the **Couchbase Mobile** tab, and download whichever platform works for you.  Once its downloaded, unzip the package and place it somewhere on your machine where you'll have good access to it, and then open a command line in the Sync Gateway directory.  You'll be running the Sync Gateway using a shell script that comes built in.  You can test by running:

	$ ./sync_gateway
	
If it connects successfully, everything should be good.  Go ahead and shut it down with **Ctrl+C**.

### Set up the application to run

Install all of the Bower dependencies listed in `bower.json`:

	$ bower install
	
**NOTE:** At the time that I put this application together, I was back and forth between PouchDB v4.0.3 and v5.0.0.  Each had some wonkiness, but the latest version at the time, v5.1.0, had a severe bug that was throwing endless 404 errors in the console and generally gumming up the pipes.  It's a problem that's been [logged as a known bug](https://github.com/pouchdb/pouchdb/issues/4602) in the PouchDB GitHub.

Running bower install will get all of the dependencies listed in the `index.html`, which will allow us to run our application.

### Sync the local DB to the Sync Gateway

Open up the `app.js` file, and take a look at lines 6 and 7, in the `module.run()` method.  The first thing you'll see is that I'm setting a name for a local database.  That can truly be anything you want, so go nuts.  
 
The second thing you'll see - so much more important, is the address for the Sync Gateway.  There are two things to note here:

1. I have my Sync Gateway installed locally, so I'm running on localhost at the SG's default port, 4984.  Change this if you need to.
2. I'm listing the `restful-sample` as the data bucket that'll be synced on Couchbase Server by listing it in the URL path.  Change that if you need to.

Next, open up the `sync-gateway-config.json` file.  There are a few things to look at here as well.

The `databases` property is an object that allows syncing with mulitple data buckets.  At this point I haven't explored syncing with views using PouchDB, but it's something worth looking at.  The only database listed here is the Couchbase Server DB - specifically the **restful-sample** data bucket.  Note that the name of the data bucket is the key to the DB object, and the server that it lives on is a property.  If you have your Couchbase Server instance running somewhere other than your local machine at the default port, you would change that there.  Similarly, if you chose a different name for your data bucket, you would change that here as well by changing the key in the `databases` object.

I do believe that your data bucket name has to match the path in the `module.run()` and the name of the database in your config.  I haven't played around with misaligning those to see what happens.

Last (for this step mind you), take a look at the `CORS` property.  I've set the allowed origin to match the default port of the local Python SimpleHTTPServer, which I used to serve up the front-end application.  I'll go more into that in the last section on running the application.

### Run the Sync Gateway

The config you just looked at might be part of this project, but it actually feeds the Sync Gateway - which might not even live on the same machine as your project.  This is where things look like they could get disjointed in a real world application and best-practices are certainly worth exploring.

From the command line that you should still have open in the Sync Gateway directory, run the shell script that starts the Sync Gateway, and pass in the config file as an argument:
 
    $ ./sync_gateway path/to/sync-gateway-config.json
    
Yeah, I have doubts about that.  If that lives on the Sync Gateway server, it can easily fall out of line with the application configuration.  

I haven't tried yet, but it might be possible to run a script that calls an HTTP request to an open file server that will return the config to the Sync Gateway.  

It should be noted that you can also run this command using command line options to configure the Sync Gateway.  However I didn't see any way to pass in CORS properties; so neither way struck me as the right way to do it.

### Run the application

To start the Python server mentioned above at the default port, run the following command: 

	$ python -m SimpleHTTPServer
	
If you want to run a different server (e.g. Node), be sure to configure the port (and domain if applicable) appropriately in the CORS section of the Sync Gateway config.

Before you test your application in your browser, make sure all of the following are true:

1. You have your Couchbase Server running
2. You've started the Sync Gateway
3. All of the configurations are aligned between the client app, the Sync Gateway config, and the Couchbase Server URL and its data bucket

Once your server is running, open your browser to [http://localhost:8000](http://localhost:8000).  Two things should happen:

1. You should see a page with a `<thead>` with some column names, a lack of rows in the `<tbody>`, and a **New Item** button.  
2. You should see some feedback in the Sync Gateway console reflecting the handling of REST calls.

Most importantly you shouldn't see any errors in the Sync Gateway.  You might see some 404s in the browser console, and a message from PouchDB saying it's totally normal.

### Test the features

Add a new record to the database by clicking the **New Item** button, filling out the form, and clicking **Save**.  That should save your input to the local database, which should sync with Couchbase Server data bucket via the Sync Gateway.  

To confirm, first make sure your record was saved locally in the browser.  You should have been redirected to the list view, which should show your record as the first entry in the table.  Next, open your [Couchbase Server](http://localhost:8091/index.html) console, and open the **Documents** view of the appropriate data bucket, which should be **restful-sample** if you went with my (or really Nic Raboy's) example.  You should see your new record in the database.

Now open up the application in a new browser, while keeping the original still open.  You should see your data record in the table when you load up the list view.  

Let's get even crazier.  In your new browser, click **New Item**, and fill out the form to add a new item.  Click **Save**, and as you do, watch the list view in your original browser window.  It should automatically add a new data record.

Each browser has its own local database (probably IndexedDB or WebSQL) that's being populated by PouchDB through user input and syncing with Couchbase Server via the Sync Gateway. To see it in action, open your browser's inspector to the **Resources** tab, and see which data stores are being used.  Open them up to see your database - the one declared in the `module.run()` as `pouchDbSrvc.setDatabase('colin-test');` - in action.