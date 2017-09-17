output "I-zone_id" {
  value = "${aws_route53_zone.dns_sd_lookup.zone_id}"
}

output "I-zone_fqdn" {
  value = "${aws_route53_zone.dns_sd_lookup.name}"
}

output "I-zone_ns" {
  value = "${aws_route53_zone.dns_sd_lookup.name_servers}"
}

output "I-type_with_1_instance_no_subtype-instance" {
  value = "${module.instance-type_with_1_instance_no_subtype.II-instance}"
}