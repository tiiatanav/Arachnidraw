class Schema < ActiveRecord::Base
  attr_accessible :json, :name, :script

def make_script
	test=make_network("testing", "nat1", "192.14.23.2", "255.255.255.0", true);
end



end

def make_network(name = "deafult", bridge = "nat0", 
				ip = "10.0.0.0", netmask = "255.255.255.0", 
				dhcp = false, from = "10.0.0.1", to = "10.0.0.200" )
	dhcp_range = "";
	if dhcp then 
		dhcp_range = "
\t\t<dhcp>
\t\t\t<range start='#{from}' end='#{to}' />
\t\t</dhcp>"
	end

	xml = "<network>
\t<name>#{name}</name>
\t<uuid>$(uuid)</uuid>
\t<forward mode='nat'/>
\t<bridge name='#{bridge}' stp='on' delay='0' />
\t<ip address='#{ip}' netmask='#{netmask}'>#{dhcp_range}
\t</ip>
</network>"
	return xml;
end

def make_guest()
guest="<domain type='kvm'>
  <name>fv0</name>
  <uuid>$(uuid)</uuid>
  <title>A short description - title - of the domain</title>
  <description>Some human readable description</description>
  <os>
    <type machine='pc-0.12' arch='x86_64'>hvm</type>
    <boot dev='hd'/>
  </os>
  <vcpu>1</vcpu> 
  <memory unit='KiB'>524288</memory> 
  <currentMemory unit='KiB'>524288</currentMemory> 
  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>restart</on_crash>
  <features>
     <pae/>
     <acpi/>
     <apic/>
     <hap/>
     <privnet/>
     <hyperv>
       <relaxed state='on'/>
     </hyperv>
   </features>
  <clock offset='localtime'> 
  </clock>
  <devices>
  	 <emulator>/usr/bin/kvm</emulator>
  	 <disk device='disk' type='file'> 
      	<driver name='qemu' type='qcow2'/>
      	
      	<source file='$IMAGE'/> 
      	<target bus='virtio' dev='vda'/>
      	<address bus='0x00' domain='0x0000' type='pci' function='0x0' slot='0x05'/>
     </disk>
     <disk device='cdrom' type='block'>
      	<driver name='qemu' type='raw'/>
      	<target bus='ide' dev='hdc'/>
      	<readonly/>
      	<address bus='1' type='drive' unit='0' controller='0'/>
     </disk>

     <controller type='ide' index='0'> 
      	<address bus='0x00' domain='0x0000' type='pci' function='0x1' slot='0x01'/>
     </controller>

     <interface type='network'>
      <source network='default'/> 
      <target dev='vnet1'/> 
     </interface>

     <interface type='bridge'> 
      <source bridge='br0'/>
      <mac address='$MAC'/>
      <model type='e1000'/>
      <target dev='vnet1'/> 
     </interface>

     <input type='mouse' bus='usb'/>

     <graphics port='-1' type='vnc' autoport='yes'> 
         	<listen type='address' address='1.2.3.4'/>
     </graphics> 
    
     <sound model='ac97'> 
      <address bus='0x00' domain='0x0000' type='pci' function='0x0' slot='0x04'/>
     </sound>
    
     <video>
      <model type='cirrus' heads='1' vram='9216'/>
      <address bus='0x00' domain='0x0000' type='pci' function='0x0' slot='0x02'/>
     </video>

     <serial type='pty'>
      	<target port='0'/>
     </serial>
    
     <console type='pty'>
      <target port='0' type='serial'/>
     </console>

  </devices>
</domain>  
  "

end
