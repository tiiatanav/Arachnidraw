class MakeSchemaNameUnique < ActiveRecord::Migration
  def up
  	add_index :schemas, :name, :unique => true
  end

  def down
  	remove_index :schemas, :name
  end
end
