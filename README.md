Arachnidraw
===========

Arachnidraw is a virtual network drawing tool that exports scripts to run instances of the drawn virtual network.

It consists of a JavaScript library (related files found in app/assets folders) and a server-side RoR application that generates the script.

The script uses libvirt virsh commands to run the described virtual machines and networks.  

# Installation/Integration #

The tool can be installed as a separate application and developed according to your needs. It can also be integrated into existing applications.

## New application ##

Send a pull request:

    git clone git://github.com/tiiatanav/Arachnidraw.git

Move into the Arachidraw folder and run

    bundle install

After that migrate the database

    rake db:migrate

...And continue the development by adding needed resources and views.

## Existing application ##

Installing the tool into an existing application consists of moving the JavaScript library and adding the server-side support.

Send a pull request to get all the needed files:

    git clone git://github.com/tiiatanav/Arachnidraw.git


### Setting up server-side ###

Generate a new resource to store the virtual network setup data: 

	rails generate scaffold schema name:string json:text script:text

You **can** add more data fields according to your need, but the **name**, **json** and **script** fields are strictly needed.

The schemas should all have unique names to allow easy distinction when browsing. Generate a new migration to add the unique key:
 
	rails generate migration makeSchemaNameUnique

Open the generated migration file from `db/migrate` and fill it with the following: 

	class MakeSchemaNameUnique < ActiveRecord::Migration
		def up
			add_index :schemas, :name, :unique => true
		end
		def down
			remove_index :schemas, :name
		end
	end

To Create the new database table and add the key run:

	rake db:migrate

To add the script generation **copy** the `app/models/schema.rb` file you downloaded to your `app/models` folder replacing the existing (scaffolded) `schema.rb` file.


Add a new method to the `app/controllers/schemas_controller.rb` to enable downloading the generated scripts

	def download
		@schema = Schema.find(params[:id])
		send_data( 	@schema.script, 
					:type => "application/xshellscript", 
					:filename => "#{@schema.name}.sh" )
	end

And add the following routing rule into the `config/routes.rb` file

	match "download/:id" =>"schemas#download"


### Setting up the library ###

Copy the JavaScript folder `app/assets/javascripts/Arachnidraw` into your applications `public/javascripts` folder ( < Rails 3.1) or `app/assets/javascripts` folder ( >= Rails 3.1)

Copy the images used by the application from `app/assets/images/Arachnidraw` into your applications `public/images` folder ( < Rails 3.1) or `app/assets/images` folder ( >= Rails 3.1)

Copy the `app/assets/stylesheets/Arachnidraw.css` file into  your applications `public/stylesheets` folder ( < Rails 3.1) or `app/assets/stylesheets` folder ( >= Rails 3.1)


Open the `public/javascripts/Arachnidraw/arachnidraw.js`  ( < Rails 3.1) or  `app/assets/javascripts/Arachnidraw/arachnidraw.js`   ( >= Rails 3.1) and change the configuration to fit your application by assigning the URIs and request methods for each action, specifying the names of the meta elements that hold the authenticity token parameter name and values.

    var canvasAppConfig = {
    	"create" : {
    		"uri":"schemas.json",
    		"method":"POST" 
    	},
    	"index" : {
    		"uri":"schemas.json",
    		"method":"GET" 
    	},
    	"update" : {
    		"uri":"schemas.json",
    		"method":"PUT" 
    	},
    	"download_uri": "download", 
    	"authenticity":{
    		"token": "csrf-token", 
    		"name": "csrf-param"
    	}
    };


Specify the image locations in the images object 

for < Rails 3.1

	var images = {
		'menu':[
				'images/Arachnidraw/new.svg',
				'images/Arachnidraw/open.svg',
				'images/Arachnidraw/save.svg',
				'images/Arachnidraw/hand.svg',
				'images/Arachnidraw/arrow2.svg',
				'images/Arachnidraw/duplicate.svg',
				'images/Arachnidraw/trash.svg',
				'images/Arachnidraw/json.png'
		], 'nodes':[
				'images/Arachnidraw/workstation.svg',
				'images/Arachnidraw/workstation_green.svg',
				'images/Arachnidraw/workstation_red.svg'
		], 'switches':[
				'images/Arachnidraw/switch.svg'
		], 'routers':[
				'images/Arachnidraw/router.svg'
		]
	};

for >= Rails 3.1

	var images = {
		'menu':[
				'/assets/Arachnidraw/new.svg',
				'/assets/Arachnidraw/open.svg',
				'/assets/Arachnidraw/save.svg',
				'/assets/Arachnidraw/hand.svg',
				'/assets/Arachnidraw/arrow2.svg',
				'/assets/Arachnidraw/duplicate.svg',
				'/assets/Arachnidraw/trash.svg',
				'/assets/Arachnidraw/json.png'
		], 'nodes':[
				'/assets/Arachnidraw/workstation.svg',
				'/assets/Arachnidraw/workstation_green.svg',
				'/assets/Arachnidraw/workstation_red.svg'
		], 'switches':[
				'/assets/Arachnidraw/switch.svg'
		], 'routers':[
				'/assets/Arachnidraw/router.svg'
		]
	};

Open the `public/stylesheets/Arachnidraw.css`  ( < Rails 3.1) or  `app/assets/stylesheets/Arachnidraw.css`   ( >= Rails 3.1) and change the image locations used in the style rules.

# Displaying the tool #

Before displaying the tool in a view make sure your application loads the needed *.js and *.css files. (You do not need to do that with  >= Rails 3.1 because assets are loaded automatically)

	<%= stylesheet_link_tag "Arachnidraw" %>
	<%= javascript_include_tag "Arachnidraw/arachnidraw", :cache=>true %>
	<%= javascript_include_tag "Arachnidraw/topology", :cache=>true %>

To include the tool in a view add the holder element:

	<div id="AppHolder"></div>

# Credits #

Coding Tiia Tänav

made as a part of a masters thesis in 2013