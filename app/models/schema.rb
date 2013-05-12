class Schema < ActiveRecord::Base
  before_save :make_script
  attr_accessible :json, :name, :script

def make_script
  tmp=JSON.parse(self.json);
  test=""

  test+=setup(tmp)

  guests=tmp['nodes']
  routers=tmp['routers']
  switches=tmp['switches']

  (0..guests.length-1).each do |i|
    test += make_guest(guests[i], i)
  end

  (0..routers.length-1).each do |i|
    test += make_network(routers[i], "routers", i)
  end

  (0..switches.length-1).each do |i|
    test += make_network(switches[i], "switches", i)
  end
  
  test+=make_virsh(tmp)

	self.script=test
end



end

# make network devices
def make_network(element, type,  index)
  # set default values where needed :  
  #     name = "deafult", bridge = "nat0", 
  #     ip = "10.0.0.0", netmask = "255.255.255.0", 
  #     dhcp = false, from = "10.0.0.1", to = "10.0.0.200"

	dhcp_range = "";
	if element["dhcp"] then 
		dhcp_range = "
\t\t<dhcp>
\t\t\t<range start='#{element["dhcpFrom"]}' end='#{element["dhcpTo"]}' />
\t\t</dhcp>"
	end

	xml = "\ncat > ${#{type.upcase}_XML[#{index}]} << LOPP
<network>
\t<name>#{element["name"]}</name>
\t<uuid>$(uuid)</uuid>
\t<forward mode='#{element['forward']}'/>
\t<bridge name='#{element["bridgeName"]}' stp='on' delay='0' />
\t<ip address='#{element["ip"]}' netmask='#{element["netmask"]}'>#{dhcp_range}
\t</ip>
</network>
LOPP
"
	return xml;
end

# make the guest xml and image copying
def make_guest(element, index)

  features = ""
  features+="\n\t\t<pae/>" if element["pae"]
  features+="\n\t\t<acpi/>" if element["acpi"]
  features+="\n\t\t<apic/>" if element["apic"]
  features+="\n\t\t<hap/>" if element["hap"]
  features+="\n\t\t<privnet/>" if element["privnet"]
  features+="\n\t\t<hyperv>\n\t\t\t<relaxed state='on'/>\n\t\t<hyperv/>" if element["hyperv"]

  images = ""
  disk_elements = ""
# make disk image copying script and disk elements
   (0..element["disks"].length-1).each do |i|
    disk=element["disks"][i]
    disk["new_source"]=element['name']+i.to_s+".img"
    # make the image copy commands - ARE THERE ONLY *.img FILES?
    images+="j=${VIRT_DIR}/#{disk["new_source"]}
cp #{disk["source"]} $j
chgrp libvirtd $j

"
# NB! use the new, copied locations
    disk_elements+= "\n\t\t<disk device='#{disk["device"]}' type='#{disk["type"]}'> 
\t\t\t<driver name='#{disk["driverName"]}' type='#{disk["driverType"]}'/>   
\t\t\t<source file='${VIRT_DIR}/#{disk["new_source"]}'/> 
\t\t\t<target bus='#{disk["targetBus"]}' dev='#{disk["targetDev"]}'/> 
\t\t\t<address bus='0x00' domain='0x0000' type='pci' function='0x0' slot='0x0#{5+i}'/>
\t\t</disk>"
  end

# make network elements
network_elements=""
(0..element["networks"].length-1).each do |i|
  net=element["networks"][i];
  network_elements+="\n\t\t<interface type='network'>
\t\t\t<source network='#{net['name']}'/> 
\t\t\t<target dev='#{net['dev']}'/> 
\t\t</interface>
"
end

# make bridge elements and the mac requests
askfor=""
bridge_elements=""
(0..element["bridges"].length-1).each do |i|
  bridge=element["bridges"][i];
  mac=""
  if bridge['hasMac']=="static" && bridge['mac']!="" then
    mac="\n\t\t\t<mac address='#{bridge['mac']}'/>"
  elsif bridge['hasMac']=="ask" then
    askfor+="echo \"Please give the MAC aadress for bridge: #{bridge['name']} @ #{bridge['dev']}\"
read ${MAC[#{i}]}\n" 
    mac="\n\t\t\t<mac address='${MAC[#{i}]}'/>"
  end
  bridge_elements+="\t\t<interface type='bridge'> 
\t\t\t<source bridge='#{bridge['name']}'/>
\t\t\t<model type='e1000'/>
\t\t\t<target dev='#{bridge['dev']}'/>#{mac} 
\t\t</interface>
"
end

  guest="cat > ${GUESTS_XML[#{index}]} << LOPP
<domain type='kvm'>
\t<name>#{element["name"]}</name>
\t<uuid>$(uuid)</uuid>

\t<os>
\t\t<type machine='pc-0.12' arch='x86_64'>hvm</type>
\t\t<boot dev='hd'/>
\t</os>

\t<vcpu>#{element["cpu"]}</vcpu> 

\t<memory unit='#{element["memoryUnit"]}'>#{element["memory"]}</memory> 
\t<currentMemory unit='#{element["memoryUnit"]}'>#{element["currentMemory"]}</currentMemory> 

\t<on_poweroff>destroy</on_poweroff>
\t<on_reboot>restart</on_reboot>
\t<on_crash>restart</on_crash>

\t<features>#{features}
\t</features>

\t<clock offset='localtime'></clock>

\t<devices>

\t\t<emulator>/usr/bin/kvm</emulator>
#{disk_elements}
\n\t\t<disk device='cdrom' type='block'>
\t\t\t<driver name='qemu' type='raw'/>
\t\t\t<target bus='ide' dev='hdc'/>
\t\t\t<readonly/>
\t\t\t<address bus='1' type='drive' unit='0' controller='0'/>
\t\t</disk>

\t\t<controller type='ide' index='0'> 
\t\t\t<address bus='0x00' domain='0x0000' type='pci' function='0x1' slot='0x01'/>
\t\t</controller>#{network_elements}
#{bridge_elements}
\t\t<input type='mouse' bus='usb'/>

\t\t<graphics port='-1' type='vnc' autoport='yes'> 
\t\t\t<listen type='address' address='1.2.3.4'/>
\t\t</graphics> 
    
\t\t<sound model='ac97'> 
\t\t\t<address bus='0x00' domain='0x0000' type='pci' function='0x0' slot='0x04'/>
\t\t</sound>
    
\t\t<video>
\t\t\t<model type='cirrus' heads='1' vram='9216'/>
\t\t\t<address bus='0x00' domain='0x0000' type='pci' function='0x0' slot='0x02'/>
\t\t</video>

\t\t<serial type='pty'>
\t\t\t<target port='0'/>
\t\t</serial>
    
\t\t<console type='pty'>
\t\t\t<target port='0' type='serial'/>
\t\t</console>

\t</devices>
</domain>  
LOPP 
"
  return images+askfor+guest;
end

# make the start of the script, declaring values and checking for image existance
def setup(all)
  guests=all['nodes']
  routers=all['routers']
  switches=all['switches']

  variables="\nVIRT_DIR=\"/var/lib/libvirt/images\"
XML_DIR=\"/etc/libvirt/qemu/\"
GUESTS_XML=("
  # go trough all guests and populate arrays
  script="\n#!/bin/bash

declare -a disk_sources=("
  disks=[];
  (0..guests.length-1).each do |i|
    element=guests[i]
    # populate the guest xml array
    variables+=" \"${XML_DIR}#{element['name']}.xml\" "
    (0..element["disks"].length-1).each do |j|
        disk=element["disks"][j]
        #populate the disks array
        disks.push(disk['source'])
    end
  end
  # iterate over the unique files found in the json
  disks.uniq!
  (0..disks.length-1).each do |i|
    script+=" \"#{disks[i]}\" "
  end
  # check if all the images exist, if there is one missing, exit with a notice
  script +=")
for img in ${disk_sources[@]}
do
\tif [ ! -f \"$img\" ]; then
\t\techo \"Disk image file not located: $img\"
\t\texit 2
\tfi
done
# there were no missing images, define variables and make copies to the libvirt folder"
# populate other XML file arrays
  variables+=")
ROUTERS_XML=("
  (0..routers.length-1).each do |i|
    element=routers[i]
    #populate the networks_xml array
    variables+=" \"${XML_DIR}#{element['name']}.xml\" "
  end
  variables+=")
SWITCHES_XML=("
  (0..switches.length-1).each do |i|
    element=switches[i]
     variables+=" \"${XML_DIR}#{element['name']}.xml\" "
  end
variables+=")\n\n"
  return script+variables
end


# create the virsh commnds to start the network
def make_virsh(all)
  guests=all['nodes']
  routers=all['routers']
  switches=all['switches']

  virsh=""
   (0..routers.length-1).each do |i|
    virsh+="\nvirsh -c qemu:///system net-create ${ROUTERS_XML[#{i}]} || {
\techo \"Creating instance '#{routers[i]['name']}' failed\"
\texit 1
}"
  end
  (0..switches.length-1).each do |i|
    virsh+="\nvirsh -c qemu:///system net-create ${SWITCHES_XML[#{i}]} ||  {
\techo \"Creating instance '#{switches[i]['name']}' failed\"
\texit 1
}"
  end
  (0..guests.length-1).each do |i|
    virsh+="\nvirsh -c qemu:///system create ${GUESTS_XML[#{i}]} ||  {
\techo \"Creating instance '#{guests[i]['name']}' failed\"
\texit 1
}"
  end

  return virsh
end